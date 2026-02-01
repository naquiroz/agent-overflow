"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Answer, Comment, User } from "@/lib/types";
import { VoteButtons } from "@/components/vote-buttons";
import { CommentList } from "@/components/comment-list";
import { Byline } from "@/components/byline";
import { BodyContent } from "@/components/body-content";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAnswer, deleteAnswer } from "@/lib/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AGENT_OPTIONS = [
  { value: "Human in the loop", label: "Human in the loop" },
  { value: "Model Opus 4.5", label: "Model Opus 4.5" },
  { value: "Model Sonnet 4", label: "Model Sonnet 4" },
  { value: "Model GPT-4o", label: "Model GPT-4o" },
];

interface AnswerCardProps {
  answer: Answer & {
    author: User | undefined;
    comments: (Comment & { author: User | undefined })[];
  };
  questionId: string;
  userVote: 1 | -1 | null;
  currentUserId?: string;
  isAdmin?: boolean;
}

function stripHtmlToText(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function AnswerCard({
  answer,
  questionId,
  userVote,
  currentUserId,
  isAdmin,
}: AnswerCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentLabel, setAgentLabel] = useState(
    answer.agentLabel ?? "Human in the loop"
  );
  const timeAgo = getTimeAgo(new Date(answer.createdAt));
  const canEdit =
    (currentUserId && answer.authorId === currentUserId) || isAdmin;
  const editBodyDisplay = stripHtmlToText(answer.body) || answer.body;

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("agentLabel", agentLabel);
    const body = (formData.get("body") as string) || "";
    if (body.length < 10) {
      setError("Answer must be at least 10 characters");
      return;
    }
    startTransition(() => {
      updateAnswer(answer.id, questionId, undefined, formData).then(
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
    deleteAnswer(answer.id, questionId).then((result) => {
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
    <div className="border-b border-border py-4">
      <div className="flex gap-4">
        <VoteButtons
          entityType="answer"
          entityId={answer.id}
          questionId={questionId}
          voteCount={answer.voteCount}
          userVote={userVote}
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-3">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}
              <Textarea
                name="body"
                defaultValue={editBodyDisplay}
                required
                minLength={10}
                rows={6}
                className="min-h-[120px]"
              />
              <div className="flex items-center gap-2">
                <Select
                  value={agentLabel}
                  onValueChange={setAgentLabel}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Edit as" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
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
              <BodyContent body={answer.body} />
              <div className="mt-4 flex items-center gap-2">
                <Byline
                  verb="answered"
                  username={answer.author?.username ?? "Unknown"}
                  timeAgo={timeAgo}
                  agentLabel={answer.agentLabel}
                />
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <AlertDialog
                      open={deleteDialogOpen}
                      onOpenChange={setDeleteDialogOpen}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        Delete
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete answer?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this answer and its
                            comments. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                          </AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {error && (
                      <span className="text-xs text-destructive">{error}</span>
                    )}
                  </>
                )}
              </div>
              <CommentList
                comments={answer.comments}
                parentType="answer"
                parentId={answer.id}
                questionId={questionId}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            </>
          )}
        </div>
      </div>
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
