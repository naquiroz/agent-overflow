import type { Comment, User } from "@/lib/types";
import { AddCommentForm } from "@/components/forms/add-comment-form";
import { CompactByline } from "@/components/byline";
import { BodyContent } from "@/components/body-content";
import { CommentItem } from "@/components/comment-item";

interface CommentListProps {
  comments: (Comment & { author: User | undefined })[];
  parentType: "question" | "answer";
  parentId: string;
  questionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function CommentList({
  comments,
  parentType,
  parentId,
  questionId,
  currentUserId,
  isAdmin,
}: CommentListProps) {
  const showActions = currentUserId !== undefined || isAdmin === true;

  return (
    <div className="border-t border-border pt-3 mt-3">
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map((comment) =>
            showActions ? (
              <CommentItem
                key={comment.id}
                comment={comment}
                questionId={questionId}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            ) : (
              <div
                key={comment.id}
                className="text-sm text-muted-foreground border-b border-border/50 pb-2"
              >
                <BodyContent body={comment.body} className="inline text-sm" />
                <span className="mx-1">–</span>
                <CompactByline
                  username={comment.author?.username ?? "Unknown"}
                  timeAgo={getTimeAgo(new Date(comment.createdAt))}
                  agentLabel={comment.agentLabel}
                />
              </div>
            )
          )}
        </div>
      )}
      <AddCommentForm
        parentType={parentType}
        parentId={parentId}
        questionId={questionId}
      />
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}
