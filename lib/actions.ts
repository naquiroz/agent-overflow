"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHash, randomBytes } from "crypto";
import { readStore, writeStore, getUserByUsername, applyReputationDelta } from "./store";
import { hasPrivilege } from "./privileges";
import { getSession, setSession, clearSession } from "./session";
import type { User, Question, Answer, Comment, Vote } from "./types";

// Password hashing helpers
function hashPassword(password: string, salt: string): string {
  return createHash("sha256")
    .update(password + salt)
    .digest("hex");
}

function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

// Auth actions
export async function register(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!username || username.length < 3) {
    return { error: "Use at least 3 characters for your username." };
  }

  if (!password || password.length < 6) {
    return { error: "Use at least 6 characters for your password." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords don't match. Please check and try again." };
  }

  const existingUser = getUserByUsername(username);
  if (existingUser) {
    return { error: "This username is already taken. Try another." };
  }

  const store = readStore();
  const salt = generateSalt();
  const user: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash: hashPassword(password, salt),
    salt,
    createdAt: new Date().toISOString(),
    role: "default",
    reputation: 1,
  };

  store.users.push(user);
  writeStore(store);

  await setSession(user.id);
  redirect("/");
}

export async function login(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Please enter your username and password." };
  }

  const user = getUserByUsername(username);
  if (!user) {
    return { error: "Username or password is incorrect. Please try again." };
  }
  if (user.deletedAt) {
    return { error: "This account has been deleted." };
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return { error: "Username or password is incorrect. Please try again." };
  }

  await setSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/");
}

export async function updateUserRole(
  userId: string,
  newRole: "admin" | "default"
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in" };
  }
  if (session.role !== "admin") {
    return { error: "Only admins can change user roles" };
  }
  if (userId === session.id && newRole === "default") {
    return { error: "You cannot change your own role" };
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    return { error: "User not found" };
  }

  user.role = newRole;
  writeStore(store);
  revalidatePath("/admin/users");
  return {};
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in" };
  }
  if (session.role !== "admin") {
    return { error: "Only admins can delete users" };
  }
  if (userId === session.id) {
    return { error: "You cannot delete your own account." };
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    return { error: "User not found" };
  }
  if (user.deletedAt) {
    return { error: "User is already deleted" };
  }

  user.deletedAt = new Date().toISOString();
  writeStore(store);

  revalidatePath("/admin/users");
  return {};
}

// Question actions
export async function createQuestion(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const tagsRaw = formData.get("tags") as string;
  const agentLabel = (formData.get("agentLabel") as string) || undefined;

  if (!title || title.length < 10) {
    return { error: "Use at least 10 characters for the title." };
  }

  if (!body || body.length < 20) {
    return { error: "Use at least 20 characters for the body." };
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
    : [];

  const store = readStore();
  const question: Question = {
    id: crypto.randomUUID(),
    title,
    body,
    authorId: session.id,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    voteCount: 0,
    ...(agentLabel && { agentLabel }),
  };

  store.questions.push(question);
  writeStore(store);

  revalidatePath("/");
  redirect(`/questions/${question.id}`);
}

export async function updateQuestion(
  questionId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const tagsRaw = formData.get("tags") as string;
  const agentLabel = (formData.get("agentLabel") as string) || undefined;

  if (!title || title.length < 10) {
    return { error: "Use at least 10 characters for the title." };
  }

  if (!body || body.length < 20) {
    return { error: "Use at least 20 characters for the body." };
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
    : [];

  const store = readStore();
  const question = store.questions.find((q) => q.id === questionId);
  if (!question) {
    return { error: "Question not found" };
  }
  if (question.authorId !== session.id && session.role !== "admin") {
    return { error: "You can only edit questions you posted." };
  }

  question.title = title;
  question.body = body;
  question.tags = tags;
  question.updatedAt = new Date().toISOString();
  if (agentLabel !== undefined) {
    question.agentLabel = agentLabel || undefined;
  }

  writeStore(store);
  revalidatePath("/");
  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function deleteQuestion(questionId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to delete questions" };
  }
  if (session.role !== "admin") {
    return { error: "Only admins can delete questions" };
  }

  const store = readStore();
  const question = store.questions.find((q) => q.id === questionId);
  if (!question) {
    return { error: "Question not found" };
  }

  const answerIds = store.answers
    .filter((a) => a.questionId === questionId)
    .map((a) => a.id);

  store.questions = store.questions.filter((q) => q.id !== questionId);
  store.answers = store.answers.filter((a) => a.questionId !== questionId);
  store.comments = store.comments.filter(
    (c) =>
      !(
        (c.parentType === "question" && c.parentId === questionId) ||
        (c.parentType === "answer" && answerIds.includes(c.parentId))
      )
  );
  store.votes = store.votes.filter(
    (v) =>
      !(
        (v.entityType === "question" && v.entityId === questionId) ||
        (v.entityType === "answer" && answerIds.includes(v.entityId))
      )
  );

  writeStore(store);
  revalidatePath("/");
  revalidatePath(`/questions/${questionId}`);
  return {};
}

// Answer actions
export async function createAnswer(
  questionId: string,
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const body = formData.get("body") as string;
  const agentLabel = (formData.get("agentLabel") as string) || undefined;

  if (!body || body.length < 10) {
    return { error: "Use at least 10 characters for your answer." };
  }

  const store = readStore();
  const question = store.questions.find((q) => q.id === questionId);
  if (!question) {
    return { error: "Question not found" };
  }

  const answer: Answer = {
    id: crypto.randomUUID(),
    questionId,
    body,
    authorId: session.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    voteCount: 0,
    ...(agentLabel && { agentLabel }),
  };

  store.answers.push(answer);
  writeStore(store);

  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function updateAnswer(
  answerId: string,
  questionId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const body = formData.get("body") as string;
  const agentLabel = (formData.get("agentLabel") as string) || undefined;

  if (!body || body.length < 10) {
    return { error: "Use at least 10 characters for your answer." };
  }

  const store = readStore();
  const answer = store.answers.find((a) => a.id === answerId);
  if (!answer) {
    return { error: "Answer not found" };
  }
  if (answer.authorId !== session.id && session.role !== "admin") {
    return { error: "You can only edit answers you posted." };
  }

  answer.body = body;
  answer.updatedAt = new Date().toISOString();
  if (agentLabel !== undefined) {
    answer.agentLabel = agentLabel || undefined;
  }

  writeStore(store);
  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function deleteAnswer(
  answerId: string,
  questionId: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to delete answers" };
  }
  if (session.role !== "admin") {
    return { error: "Only admins can delete answers" };
  }

  const store = readStore();
  const answer = store.answers.find((a) => a.id === answerId);
  if (!answer) {
    return { error: "Answer not found" };
  }

  store.answers = store.answers.filter((a) => a.id !== answerId);
  store.comments = store.comments.filter(
    (c) => !(c.parentType === "answer" && c.parentId === answerId)
  );
  store.votes = store.votes.filter(
    (v) => !(v.entityType === "answer" && v.entityId === answerId)
  );

  const question = store.questions.find((q) => q.id === questionId);
  if (question) {
    if (question.acceptedAnswerId === answerId) {
      question.acceptedAnswerId = undefined;
    }
    if (question.previousAcceptedAnswerIds) {
      question.previousAcceptedAnswerIds =
        question.previousAcceptedAnswerIds.filter((id) => id !== answerId);
    }
  }

  writeStore(store);
  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function setChosenAnswer(
  questionId: string,
  answerId: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to accept an answer" };
  }

  const store = readStore();
  const question = store.questions.find((q) => q.id === questionId);
  if (!question) {
    return { error: "Question not found" };
  }

  const answer = store.answers.find((a) => a.id === answerId);
  if (!answer || answer.questionId !== questionId) {
    return { error: "Answer not found" };
  }

  if (question.authorId !== session.id && session.role !== "admin") {
    return {
      error: "Only the question author or an admin can accept an answer",
    };
  }

  const questionAuthorId = question.authorId;
  const answerAuthorId = answer.authorId;
  const isSelfAccept = questionAuthorId === answerAuthorId;

  // Reverse reputation from previous accepted answer
  const previousAcceptedId = question.acceptedAnswerId;
  if (previousAcceptedId && previousAcceptedId !== answerId) {
    const previousAnswer = store.answers.find((a) => a.id === previousAcceptedId);
    if (previousAnswer) {
      applyReputationDelta(store, previousAnswer.authorId, -15);
      if (previousAnswer.authorId !== questionAuthorId) {
        applyReputationDelta(store, questionAuthorId, -2);
      }
    }
  }

  if (question.acceptedAnswerId && question.acceptedAnswerId !== answerId) {
    question.previousAcceptedAnswerIds = [
      question.acceptedAnswerId,
      ...(question.previousAcceptedAnswerIds ?? []),
    ];
  }
  question.acceptedAnswerId = answerId;
  question.previousAcceptedAnswerIds = (
    question.previousAcceptedAnswerIds ?? []
  ).filter((id) => id !== answerId);

  // Apply reputation for new accepted answer (no rep for self-accept)
  if (!isSelfAccept) {
    applyReputationDelta(store, answerAuthorId, 15);
    applyReputationDelta(store, questionAuthorId, 2);
  }

  // Upvote the accepted answer by the current user if not already voted
  const existingVoteIndex = store.votes.findIndex(
    (v) =>
      v.userId === session.id &&
      v.entityType === "answer" &&
      v.entityId === answerId
  );
  if (existingVoteIndex === -1) {
    const newVote: Vote = {
      id: crypto.randomUUID(),
      entityType: "answer",
      entityId: answerId,
      userId: session.id,
      direction: 1,
    };
    store.votes.push(newVote);
    answer.voteCount += 1;
    // Reputation for the auto-upvote (no rep for self-vote)
    if (answerAuthorId !== session.id) {
      applyReputationDelta(store, answerAuthorId, 10);
    }
  }

  writeStore(store);
  revalidatePath(`/questions/${questionId}`);
  return {};
}

// Comment actions
export async function createComment(
  parentType: "question" | "answer",
  parentId: string,
  questionId: string,
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin" && !hasPrivilege(session.reputation ?? 0, "comment")) {
    return { error: "You need at least 50 reputation to comment." };
  }

  const body = formData.get("body") as string;
  const agentLabel = (formData.get("agentLabel") as string) || undefined;

  if (!body || body.length < 5) {
    return { error: "Use at least 5 characters for your comment." };
  }

  const store = readStore();
  const comment: Comment = {
    id: crypto.randomUUID(),
    parentType,
    parentId,
    body,
    authorId: session.id,
    createdAt: new Date().toISOString(),
    ...(agentLabel && { agentLabel }),
  };

  store.comments.push(comment);
  writeStore(store);

  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function updateComment(
  commentId: string,
  questionId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const body = formData.get("body") as string;
  const agentLabel = (formData.get("agentLabel") as string) || undefined;

  if (!body || body.length < 5) {
    return { error: "Use at least 5 characters for your comment." };
  }

  const store = readStore();
  const comment = store.comments.find((c) => c.id === commentId);
  if (!comment) {
    return { error: "Comment not found" };
  }
  if (comment.authorId !== session.id && session.role !== "admin") {
    return { error: "You can only edit comments you posted." };
  }

  comment.body = body;
  comment.updatedAt = new Date().toISOString();
  if (agentLabel !== undefined) {
    comment.agentLabel = agentLabel || undefined;
  }

  writeStore(store);
  revalidatePath(`/questions/${questionId}`);
  return {};
}

export async function deleteComment(
  commentId: string,
  questionId: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to delete comments" };
  }
  if (session.role !== "admin") {
    return { error: "Only admins can delete comments" };
  }

  const store = readStore();
  const comment = store.comments.find((c) => c.id === commentId);
  if (!comment) {
    return { error: "Comment not found" };
  }

  store.comments = store.comments.filter((c) => c.id !== commentId);
  writeStore(store);
  revalidatePath(`/questions/${questionId}`);
  return {};
}

// Vote actions
export async function vote(
  entityType: "question" | "answer",
  entityId: string,
  questionId: string,
  direction: 1 | -1,
  agentLabel?: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    if (direction === 1 && !hasPrivilege(session.reputation ?? 0, "vote_up")) {
      return { error: "You need at least 15 reputation to upvote." };
    }
    if (direction === -1 && !hasPrivilege(session.reputation ?? 0, "vote_down")) {
      return { error: "You need at least 125 reputation to downvote." };
    }
  }

  const store = readStore();

  // Find existing vote
  const existingVoteIndex = store.votes.findIndex(
    (v) =>
      v.userId === session.id &&
      v.entityType === entityType &&
      v.entityId === entityId
  );

  // Find the entity to update vote count
  const entity =
    entityType === "question"
      ? store.questions.find((q) => q.id === entityId)
      : store.answers.find((a) => a.id === entityId);

  if (!entity) {
    return { error: "Entity not found" };
  }

  const authorId = entity.authorId;
  const isSelfVote = authorId === session.id;
  const existingDirection: 1 | -1 | null =
    existingVoteIndex !== -1 ? store.votes[existingVoteIndex].direction : null;

  if (existingVoteIndex !== -1) {
    const existingVote = store.votes[existingVoteIndex];
    if (existingVote.direction === direction) {
      // Remove vote (toggle off)
      store.votes.splice(existingVoteIndex, 1);
      entity.voteCount -= direction;
    } else {
      // Change vote direction
      entity.voteCount -= existingVote.direction;
      entity.voteCount += direction;
      existingVote.direction = direction;
    }
  } else {
    // Add new vote
    const newVote: Vote = {
      id: crypto.randomUUID(),
      entityType,
      entityId,
      userId: session.id,
      direction,
      ...(agentLabel && { agentLabel }),
    };
    store.votes.push(newVote);
    entity.voteCount += direction;
  }

  const wasRemoved = existingDirection !== null && existingDirection === direction;
  const newDirection: 1 | -1 | null = wasRemoved ? null : direction;

  // Reputation: author deltas (no rep for self-vote)
  if (!isSelfVote && authorId) {
    if (existingDirection === 1 && newDirection === null) applyReputationDelta(store, authorId, -10);
    else if (existingDirection === 1 && newDirection === -1) applyReputationDelta(store, authorId, -12);
    else if (existingDirection === -1 && newDirection === null) applyReputationDelta(store, authorId, 2);
    else if (existingDirection === -1 && newDirection === 1) applyReputationDelta(store, authorId, 12);
    else if (existingDirection === null && newDirection === 1) applyReputationDelta(store, authorId, 10);
    else if (existingDirection === null && newDirection === -1) applyReputationDelta(store, authorId, -2);
  }
  // Voter delta (downvoting costs 1 rep)
  if (existingDirection === -1 && (newDirection === null || newDirection === 1)) applyReputationDelta(store, session.id, 1);
  else if ((existingDirection === null || existingDirection === 1) && newDirection === -1) applyReputationDelta(store, session.id, -1);

  writeStore(store);
  revalidatePath(`/questions/${questionId}`);
  return {};
}
