"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Comment, User } from "@/lib/types";
import { CompactByline } from "@/components/byline";
import { BodyContent } from "@/components/body-content";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateComment, deleteComment } from "@/lib/actions";
import { displayAuthorName } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Item,
  ItemContent,
  ItemActions,
  ItemFooter,
} from "@/components/ui/item";

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

function stripHtmlToText(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

interface CommentItemProps {
  comment: Comment & { author: User | undefined };
  questionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function CommentItem({
  comment,
  questionId,
  currentUserId,
  isAdmin,
}: CommentItemProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit =
    currentUserId &&
    (comment.authorId === currentUserId || isAdmin);
  const canDelete = isAdmin;

  const timeAgo = getTimeAgo(new Date(comment.createdAt));
  const editBodyDisplay = stripHtmlToText(comment.body) || comment.body;

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = (formData.get("body") as string) || "";
    if (body.length < 5) {
      setError("Comment must be at least 5 characters");
      return;
    }
    startTransition(() => {
      updateComment(comment.id, questionId, undefined, formData).then(
        (result) => {
          if (result?.error) {
            setError(result.error);
          } else {
            setIsEditing(false);
            router.refresh();
          }
        }
      );
    });
  };

  const handleDeleteConfirm = () => {
    setError(null);
    setIsDeleting(true);
    deleteComment(comment.id, questionId).then((result) => {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Item size="sm" variant="muted" className="text-sm border rounded-md py-2 px-3">
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="min-w-0 flex-1 space-y-2">
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
              {error}
            </div>
          )}
          <Textarea
            name="body"
            defaultValue={editBodyDisplay}
            required
            minLength={5}
            rows={2}
            className="min-h-[60px] text-sm w-full"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setError(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <ItemContent className="flex-1 min-w-0 gap-0 basis-full order-first">
            <BodyContent body={comment.body} className="inline text-sm text-foreground [&_p]:inline [&_p]:text-foreground" />
          </ItemContent>
          <div className="flex basis-full flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
            <ItemFooter className="flex-shrink-0 text-muted-foreground border-0 p-0 justify-start">
              <span className="mr-1">–</span>
              <CompactByline
                username={displayAuthorName(comment.author)}
                timeAgo={timeAgo}
                agentLabel={comment.agentLabel}
                usernameForProfile={comment.author?.username}
              />
              {comment.updatedAt && (
                <span className="ml-1 text-muted-foreground/80">(edited)</span>
              )}
            </ItemFooter>
            {(canEdit || canDelete) && (
              <ItemActions className="gap-0.5 p-0 shrink-0">
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-auto py-0.5 px-1 text-[0.6875rem] text-muted-foreground/70 hover:bg-transparent hover:text-muted-foreground"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <>
                    {canEdit && <span className="text-muted-foreground/50 text-[0.6875rem]">·</span>}
                    <AlertDialog
                      open={deleteDialogOpen}
                      onOpenChange={setDeleteDialogOpen}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="h-auto py-0.5 px-1 text-[0.6875rem] text-destructive/70 hover:bg-transparent hover:text-destructive/90"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        Delete
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this comment. This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                          </AlertDialogCancel>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </ItemActions>
            )}
          </div>
        </>
      )}
    </Item>
  );
}
