import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { Store, Question, Answer, Comment, User, UserListItem } from "./types";

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
  }));
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
