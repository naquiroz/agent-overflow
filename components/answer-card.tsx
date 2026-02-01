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
import { updateAnswer, deleteAnswer, setChosenAnswer } from "@/lib/actions";
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
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemHeader,
  ItemFooter,
  ItemActions,
} from "@/components/ui/item";
import { CheckCircle2, Check } from "lucide-react";

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
  canUpvote?: boolean;
  canDownvote?: boolean;
  canComment?: boolean;
  acceptedAnswerId?: string;
  previousAcceptedAnswerIds?: string[];
  questionAuthorId: string;
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
  canUpvote = true,
  canDownvote = true,
  canComment = true,
  acceptedAnswerId,
  previousAcceptedAnswerIds = [],
  questionAuthorId,
}: AnswerCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [acceptWarningOpen, setAcceptWarningOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentLabel, setAgentLabel] = useState(
    answer.agentLabel ?? "Human in the loop"
  );
  const timeAgo = getTimeAgo(new Date(answer.createdAt));
  const canEdit =
    (currentUserId && answer.authorId === currentUserId) || isAdmin;
  const isChosenAnswer = answer.id === acceptedAnswerId;
  const isPreviouslyChosen = previousAcceptedAnswerIds.includes(answer.id);
  const canChooseAnswer =
    !!currentUserId &&
    (questionAuthorId === currentUserId || !!isAdmin);
  const editBodyDisplay = stripHtmlToText(answer.body) || answer.body;

  const runSetChosenAnswer = () => {
    setError(null);
    setIsAccepting(true);
    setChosenAnswer(questionId, answer.id).then((result) => {
      setIsAccepting(false);
      setAcceptWarningOpen(false);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleAcceptClick = () => {
    if (acceptedAnswerId && acceptedAnswerId !== answer.id) {
      setAcceptWarningOpen(true);
    } else {
      runSetChosenAnswer();
    }
  };

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
    <div className="border-b border-border py-6 last:border-b-0">
      <div className="flex gap-4">
        <VoteButtons
          entityType="answer"
          entityId={answer.id}
          questionId={questionId}
          voteCount={answer.voteCount}
          userVote={userVote}
          isSignedIn={!!currentUserId}
          canUpvote={canUpvote}
          canDownvote={canDownvote}
        />
        <div className="flex-1 min-w-0 flex flex-col gap-0">
          <Item
            variant="outline"
            size="default"
            className="rounded-lg border-border bg-card shadow-sm px-4 py-4 flex-wrap"
          >
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="basis-full space-y-3">
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
                  className="min-h-[120px] w-full"
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
                <ItemHeader className="flex-wrap gap-2">
                  {isChosenAnswer && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 bg-primary/10 text-primary border-primary/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Accepted answer
                    </Badge>
                  )}
                  {isPreviouslyChosen && (
                    <span className="text-xs text-muted-foreground">
                      Previously accepted solution
                    </span>
                  )}
                  {canChooseAnswer && !isChosenAnswer && (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="gap-1.5 shrink-0"
                        onClick={handleAcceptClick}
                        disabled={isAccepting}
                      >
                        <Check className="h-4 w-4" />
                        {isAccepting ? "Saving..." : "Accept as chosen answer"}
                      </Button>
                      <AlertDialog
                        open={acceptWarningOpen}
                        onOpenChange={setAcceptWarningOpen}
                      >
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Change accepted answer?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Changing the accepted answer is not recommended. Are
                              you sure you want to do this?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isAccepting}>
                              Cancel
                            </AlertDialogCancel>
                            <Button
                              onClick={runSetChosenAnswer}
                              disabled={isAccepting}
                            >
                              {isAccepting ? "Saving..." : "Confirm"}
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </ItemHeader>
                <ItemContent className="basis-full flex-none gap-0">
                  <div className="text-foreground [&_p]:text-[15px] [&_p]:leading-relaxed w-full">
                    <BodyContent body={answer.body} />
                  </div>
                </ItemContent>
                <ItemFooter className="basis-full border-t border-border bg-muted/30 -mx-4 -mb-4 px-4 py-3 rounded-b-lg justify-between gap-2 flex-wrap">
                  <Byline
                    verb="answered"
                    username={displayAuthorName(answer.author)}
                    timeAgo={timeAgo}
                    agentLabel={answer.agentLabel}
                    usernameForProfile={answer.author?.username}
                  />
                  <ItemActions className="gap-1 shrink-0">
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
                    {isAdmin && (
                      <>
                        {canEdit && (
                          <span className="text-muted-foreground/50 text-[0.6875rem]">·</span>
                        )}
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
                  </ItemActions>
                </ItemFooter>
                {!isEditing && (
                  <div className="basis-full mt-0">
                    <CommentList
                      comments={answer.comments}
                      parentType="answer"
                      parentId={answer.id}
                      questionId={questionId}
                      currentUserId={currentUserId}
                      isAdmin={isAdmin}
                      canComment={canComment}
                    />
                  </div>
                )}
              </>
            )}
          </Item>
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
