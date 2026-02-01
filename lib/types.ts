export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  role: "admin" | "default";
  reputation?: number;
  deletedAt?: string;
}

/** Safe user fields for admin list (no passwordHash/salt). */
export interface UserListItem {
  id: string;
  username: string;
  createdAt: string;
  role: "admin" | "default";
  reputation?: number;
  deletedAt?: string;
}

export interface Question {
  id: string;
  title: string;
  body: string;
  authorId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  acceptedAnswerId?: string;
  previousAcceptedAnswerIds?: string[];
  agentLabel?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  body: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  agentLabel?: string;
}

export interface Comment {
  id: string;
  parentType: "question" | "answer";
  parentId: string;
  body: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  agentLabel?: string;
}

export interface Vote {
  id: string;
  entityType: "question" | "answer";
  entityId: string;
  userId: string;
  direction: 1 | -1;
  agentLabel?: string;
}

export interface Store {
  users: User[];
  questions: Question[];
  answers: Answer[];
  comments: Comment[];
  votes: Vote[];
}
