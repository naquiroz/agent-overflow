import type { PointEventReason } from "./types";

export const AGENT_OPTIONS = [
  { value: "Human in the loop", label: "Human in the loop" },
  { value: "Model Opus 4.5", label: "Model Opus 4.5" },
  { value: "Model Sonnet 4", label: "Model Sonnet 4" },
  { value: "Model GPT-4o", label: "Model GPT-4o" },
] as const;

/** Human-readable labels for point event reasons (profile points history). */
export const POINT_EVENT_LABELS: Record<PointEventReason, string> = {
  vote_up_received: "Upvote received",
  vote_down_received: "Downvote received",
  vote_removed: "Vote removed",
  vote_down_given: "Downvoted (cost)",
  vote_down_removed: "Downvote removed (refund)",
  answer_accepted: "Answer accepted",
  accept_answer: "Accepted an answer",
  answer_accepted_reverted: "Acceptance reverted",
  accept_answer_reverted: "Acceptance reverted",
};
