import Link from "next/link";
import { Fragment } from "react";
import type { Comment, User } from "@/lib/types";
import { AddCommentForm } from "@/components/forms/add-comment-form";
import { CompactByline } from "@/components/byline";
import { BodyContent } from "@/components/body-content";
import { CommentItem } from "@/components/comment-item";
import { displayAuthorName } from "@/lib/utils";
import { Item, ItemContent, ItemFooter, ItemGroup, ItemSeparator } from "@/components/ui/item";

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
  const showActions = currentUserId !== undefined || isAdmin === true;

  return (
    <div className="border-t border-border pt-4 mt-4 space-y-3">
      {comments.length > 0 && (
        <ItemGroup className="mb-3" data-size="sm">
          {comments.map((comment, index) => (
            <Fragment key={comment.id}>
              {index > 0 && <ItemSeparator />}
              {showActions ? (
                <CommentItem
                  comment={comment}
                  questionId={questionId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                />
              ) : (
                <Item
                  size="sm"
                  variant="muted"
                  className="text-sm border rounded-md py-2 px-3"
                >
                  <ItemContent className="flex-1 min-w-0 gap-0">
                    <BodyContent body={comment.body} className="inline text-sm text-foreground [&_p]:inline [&_p]:text-foreground" />
                  </ItemContent>
                  <ItemFooter className="flex-shrink-0 text-xs text-muted-foreground p-0">
                    <span className="mr-1">–</span>
                    <CompactByline
                      username={displayAuthorName(comment.author)}
                      timeAgo={getTimeAgo(new Date(comment.createdAt))}
                      agentLabel={comment.agentLabel}
                      usernameForProfile={comment.author?.username}
                    />
                  </ItemFooter>
                </Item>
              )}
            </Fragment>
          ))}
        </ItemGroup>
      )}
      {currentUserId ? (
        canComment ? (
          <AddCommentForm
            parentType={parentType}
            parentId={parentId}
            questionId={questionId}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            You need 50 reputation to comment.
          </p>
        )
      ) : (
        <Link
          href={`/login?redirect=/questions/${questionId}`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Sign in to add a comment
        </Link>
      )}
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
