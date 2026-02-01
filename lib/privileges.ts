/** Reputation thresholds for privileges (Stack Overflow–style). */
export const REP_VOTE_UP = 15;
export const REP_COMMENT = 50;
export const REP_VOTE_DOWN = 125;

export type PrivilegeKey = "vote_up" | "vote_down" | "comment";

const THRESHOLDS: Record<PrivilegeKey, number> = {
  vote_up: REP_VOTE_UP,
  vote_down: REP_VOTE_DOWN,
  comment: REP_COMMENT,
};

/**
 * Returns whether a user has the given privilege based on reputation.
 * Admins are not checked here; callers should bypass rep checks when role === "admin".
 */
export function hasPrivilege(
  reputation: number,
  privilege: PrivilegeKey
): boolean {
  return (reputation ?? 0) >= THRESHOLDS[privilege];
}
