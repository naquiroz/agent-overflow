import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type {
  Store,
  Question,
  Answer,
  Comment,
  User,
  UserListItem,
  PointEvent,
  PointEventReason,
} from "./types";

const DATA_DIR = join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "store.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getEmptyStore(): Store {
  return {
    users: [],
    questions: [],
    answers: [],
    comments: [],
    votes: [],
    pointEvents: [],
  };
}

export function readStore(): Store {
  ensureDataDir();
  if (!existsSync(STORE_PATH)) {
    const empty = getEmptyStore();
    writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  const data = readFileSync(STORE_PATH, "utf-8");
  const store = JSON.parse(data) as Store;
  // One-time migration: existing users without role become admin
  let needsWrite = false;
  for (const user of store.users) {
    if (!("role" in user) || (user.role !== "admin" && user.role !== "default")) {
      (user as User).role = "admin";
      needsWrite = true;
    }
    if (!("reputation" in user) || typeof (user as User).reputation !== "number") {
      (user as User).reputation = 1;
      needsWrite = true;
    }
  }
  if (!store.pointEvents || !Array.isArray(store.pointEvents)) {
    (store as Store).pointEvents = [];
    needsWrite = true;
  }
  if (needsWrite) {
    writeStore(store);
  }
  return store;
}

export function writeStore(store: Store): void {
  ensureDataDir();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// User helpers
export function getUserById(id: string): User | undefined {
  const store = readStore();
  return store.users.find((u) => u.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  const store = readStore();
  return store.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
}

export function getUsersForAdmin(): UserListItem[] {
  const store = readStore();
  return store.users.map((u) => ({
    id: u.id,
    username: u.username,
    createdAt: u.createdAt,
    role: u.role,
    ...(u.reputation != null && { reputation: u.reputation }),
    ...(u.deletedAt != null && { deletedAt: u.deletedAt }),
  }));
}

// Stats helper
export function getStats(): {
  totalQuestions: number;
  totalAnswers: number;
  totalUsers: number;
} {
  const store = readStore();
  return {
    totalQuestions: store.questions.length,
    totalAnswers: store.answers.length,
    totalUsers: store.users.filter((u) => !u.deletedAt).length,
  };
}

// Question helpers
export function getQuestions(): (Question & {
  author: User | undefined;
  answerCount: number;
})[] {
  const store = readStore();
  return store.questions
    .map((q) => ({
      ...q,
      author: store.users.find((u) => u.id === q.authorId),
      answerCount: store.answers.filter((a) => a.questionId === q.id).length,
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getQuestionById(id: string): {
  question: Question & { author: User | undefined };
  answers: (Answer & {
    author: User | undefined;
    comments: (Comment & { author: User | undefined })[];
  })[];
  comments: (Comment & { author: User | undefined })[];
} | null {
  const store = readStore();
  const question = store.questions.find((q) => q.id === id);
  if (!question) return null;

  const questionComments = store.comments
    .filter((c) => c.parentType === "question" && c.parentId === id)
    .map((c) => ({
      ...c,
      author: store.users.find((u) => u.id === c.authorId),
    }))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const answers = store.answers
    .filter((a) => a.questionId === id)
    .map((a) => ({
      ...a,
      author: store.users.find((u) => u.id === a.authorId),
      comments: store.comments
        .filter((c) => c.parentType === "answer" && c.parentId === a.id)
        .map((c) => ({
          ...c,
          author: store.users.find((u) => u.id === c.authorId),
        }))
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  return {
    question: {
      ...question,
      author: store.users.find((u) => u.id === question.authorId),
    },
    answers,
    comments: questionComments,
  };
}

// Reputation: mutate in memory; caller must writeStore. Floor is 1.
export function applyReputationDelta(
  store: Store,
  userId: string,
  delta: number
): void {
  const user = store.users.find((u) => u.id === userId);
  if (!user) return;
  const current = user.reputation ?? 1;
  user.reputation = Math.max(1, current + delta);
}

/** Apply reputation delta and record a point event for profile/history. Caller must writeStore. */
export function applyPointsDelta(
  store: Store,
  userId: string,
  delta: number,
  reason: PointEventReason,
  ref?: { questionId?: string; answerId?: string }
): void {
  applyReputationDelta(store, userId, delta);
  const event: PointEvent = {
    id: crypto.randomUUID(),
    userId,
    delta,
    reason,
    createdAt: new Date().toISOString(),
    ...(ref?.questionId && { questionId: ref.questionId }),
    ...(ref?.answerId && { answerId: ref.answerId }),
  };
  store.pointEvents.push(event);
}

// Vote helpers
export function getUserVote(
  userId: string,
  entityType: "question" | "answer",
  entityId: string
): 1 | -1 | null {
  const store = readStore();
  const vote = store.votes.find(
    (v) =>
      v.userId === userId &&
      v.entityType === entityType &&
      v.entityId === entityId
  );
  return vote?.direction ?? null;
}

// Profile: safe user + activity for display
export interface UserProfilePointEvent {
  id: string;
  delta: number;
  reason: PointEventReason;
  createdAt: string;
  questionId?: string;
  answerId?: string;
}

export interface UserProfileData {
  profile: {
    id: string;
    username: string;
    createdAt: string;
    role: "admin" | "default";
    reputation?: number;
  };
  pointEvents: UserProfilePointEvent[];
  questions: {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    voteCount: number;
  }[];
  answers: {
    id: string;
    questionId: string;
    body: string;
    createdAt: string;
    questionTitle: string;
  }[];
  comments: {
    id: string;
    parentType: "question" | "answer";
    parentId: string;
    body: string;
    createdAt: string;
    questionId: string;
    questionTitle: string;
  }[];
}

export function getUserProfileByUsername(username: string): UserProfileData | null {
  const store = readStore();
  const user = store.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (!user) return null;

  const pointEvents = (store.pointEvents ?? [])
    .filter((e) => e.userId === user.id)
    .map((e) => ({
      id: e.id,
      delta: e.delta,
      reason: e.reason,
      createdAt: e.createdAt,
      ...(e.questionId && { questionId: e.questionId }),
      ...(e.answerId && { answerId: e.answerId }),
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const questions = store.questions
    .filter((q) => q.authorId === user.id)
    .map((q) => ({
      id: q.id,
      title: q.title,
      body: q.body,
      createdAt: q.createdAt,
      voteCount: q.voteCount,
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const answers = store.answers
    .filter((a) => a.authorId === user.id)
    .map((a) => {
      const q = store.questions.find((q) => q.id === a.questionId);
      return {
        id: a.id,
        questionId: a.questionId,
        body: a.body,
        createdAt: a.createdAt,
        questionTitle: q?.title ?? "Unknown question",
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const comments = store.comments
    .filter((c) => c.authorId === user.id)
    .map((c) => {
      const questionId =
        c.parentType === "question"
          ? c.parentId
          : (() => {
              const ans = store.answers.find((a) => a.id === c.parentId);
              return ans?.questionId ?? "";
            })();
      const q = store.questions.find((q) => q.id === questionId);
      return {
        id: c.id,
        parentType: c.parentType,
        parentId: c.parentId,
        body: c.body,
        createdAt: c.createdAt,
        questionId,
        questionTitle: q?.title ?? "Unknown question",
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return {
    profile: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      role: user.role,
      ...(user.reputation != null && { reputation: user.reputation }),
    },
    pointEvents,
    questions,
    answers,
    comments,
  };
}
