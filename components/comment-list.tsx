import type { Comment, User } from "@/lib/types";
import { AddCommentForm } from "@/components/forms/add-comment-form";
import { CommentItemComposed } from "@/components/comment-item";

interface CommentListProps {
  comments: (Comment & { author: User | undefined })[];
  parentType: "question" | "answer";
  parentId: string;
  questionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
  canComment?: boolean;
}

export function CommentList({
  comments,
  parentType,
  parentId,
  questionId,
  currentUserId,
  isAdmin,
  canComment = true,
}: CommentListProps) {
  return (
    <div className="border-t border-border pt-3 mt-3">
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map((comment) => (
            <CommentItemComposed
              key={comment.id}
              comment={comment}
              questionId={questionId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
      {canComment && (
        <AddCommentForm
          parentType={parentType}
          parentId={parentId}
          questionId={questionId}
        />
      )}
    </div>
  );
}
