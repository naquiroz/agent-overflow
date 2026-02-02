"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import type { Answer, Comment, User } from "@/lib/types";
import { VoteButtons } from "@/components/vote-buttons";
import { CommentList } from "@/components/comment-list";
import { Byline } from "@/components/byline";
import { BodyContent } from "@/components/body-content";
import { Button } from "@/components/ui/button";
import { RichTextEditor, RichTextEditorRef } from "@/components/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAnswer, deleteAnswer, setChosenAnswer, unacceptAnswer } from "@/lib/actions";
import { getTimeAgo } from "@/lib/utils";
import { extractTextContent } from "@/lib/lexical-utils";
import { AGENT_OPTIONS } from "@/lib/constants";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AnswerWithAuthor = Answer & {
  author: User | undefined;
  comments: (Comment & { author: User | undefined })[];
};

interface AnswerCardContextValue {
  answer: AnswerWithAuthor;
  questionId: string;
  userVote: 1 | -1 | null;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (v: boolean) => void;
  isPending: boolean;
  isDeleting: boolean;
  error: string | null;
  setError: (v: string | null) => void;
  agentLabel: string;
  setAgentLabel: (v: string) => void;
  timeAgo: string;
  editBodyDisplay: string;
  editorRef: React.RefObject<RichTextEditorRef | null>;
  handleEditSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleDeleteConfirm: () => void;
  onUpdate: (formData: FormData) => Promise<{ error?: string } | void>;
  onDelete: () => Promise<{ error?: string } | void>;
  canUpvote?: boolean;
  canDownvote?: boolean;
  isSignedIn?: boolean;
  canComment?: boolean;
  acceptedAnswerId?: string | null;
  previousAcceptedAnswerIds?: string[];
  questionAuthorId?: string;
  currentUserId?: string;
}

const AnswerCardContext = createContext<AnswerCardContextValue | null>(null);

function useAnswerCardContext() {
  const ctx = useContext(AnswerCardContext);
  if (!ctx) throw new Error("AnswerCard parts must be used within AnswerCard.Root");
  return ctx;
}

interface AnswerCardRootProps {
  answer: AnswerWithAuthor;
  questionId: string;
  userVote: 1 | -1 | null;
  onUpdate: (formData: FormData) => Promise<{ error?: string } | void>;
  onDelete: () => Promise<{ error?: string } | void>;
  children: React.ReactNode;
  canUpvote?: boolean;
  canDownvote?: boolean;
  isSignedIn?: boolean;
  canComment?: boolean;
  acceptedAnswerId?: string | null;
  previousAcceptedAnswerIds?: string[];
  questionAuthorId?: string;
  currentUserId?: string;
}

function AnswerCardRoot({
  answer,
  questionId,
  userVote,
  onUpdate,
  onDelete,
  children,
  canUpvote = true,
  canDownvote = true,
  isSignedIn = true,
  canComment = true,
  acceptedAnswerId,
  previousAcceptedAnswerIds = [],
  questionAuthorId,
  currentUserId,
}: AnswerCardRootProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentLabel, setAgentLabel] = useState(
    answer.agentLabel ?? "Human in the loop"
  );
  const editorRef = useRef<RichTextEditorRef>(null);
  const timeAgo = getTimeAgo(new Date(answer.createdAt));
  const editBodyDisplay = extractTextContent(answer.body) || answer.body;

  const handleEditSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      const form = e.currentTarget;
      const editor = editorRef.current;
      if (!editor) return;
      const json = editor.getJson();
      
      // Basic validation - check if editor has content by parsing JSON
      try {
        const state = JSON.parse(json);
        const root = state?.root;
        // Check if empty: no children or only empty paragraph
        const isEmpty = !root?.children?.length || 
          (root.children.length === 1 && 
           root.children[0].type === "paragraph" && 
           (!root.children[0].children?.length || 
            !root.children[0].children.some((c: { text?: string }) => c.text?.trim())));
        
        if (isEmpty) {
          setError("Answer must be at least 10 characters");
          return;
        }
      } catch {
        setError("Invalid editor content");
        return;
      }
      
      const formData = new FormData(form);
      formData.set("agentLabel", agentLabel);
      formData.set("body", json);
      startTransition(() => {
        onUpdate(formData).then((result) => {
          if (result?.error) setError(result.error);
          else setIsEditing(false);
        });
      });
    },
    [agentLabel, onUpdate]
  );

  const handleDeleteConfirm = useCallback(() => {
    setError(null);
    setIsDeleting(true);
    onDelete().then((result) => {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      if (result?.error) setError(result.error);
    });
  }, [onDelete]);

  const value: AnswerCardContextValue = {
    answer,
    questionId,
    userVote,
    isEditing,
    setIsEditing,
    deleteDialogOpen,
    setDeleteDialogOpen,
    isPending,
    isDeleting,
    error,
    setError,
    agentLabel,
    setAgentLabel,
    timeAgo,
    editBodyDisplay,
    editorRef,
    handleEditSubmit,
    handleDeleteConfirm,
    onUpdate,
    onDelete,
    canUpvote,
    canDownvote,
    isSignedIn,
    canComment,
    acceptedAnswerId,
    previousAcceptedAnswerIds,
    questionAuthorId,
    currentUserId,
  };

  return (
    <AnswerCardContext.Provider value={value}>
      <div className="border-b border-border py-4">
        <div className="flex gap-4">{children}</div>
      </div>
    </AnswerCardContext.Provider>
  );
}

function AnswerCardVotes() {
  const {
    answer,
    questionId,
    userVote,
    canUpvote,
    canDownvote,
    isSignedIn,
  } = useAnswerCardContext();
  return (
    <VoteButtons
      entityType="answer"
      entityId={answer.id}
      questionId={questionId}
      voteCount={answer.voteCount}
      userVote={userVote}
      isSignedIn={isSignedIn}
      canUpvote={canUpvote}
      canDownvote={canDownvote}
    />
  );
}

function AnswerCardBody() {
  const { answer, timeAgo } = useAnswerCardContext();
  return (
    <>
      <BodyContent body={answer.body} />
      <div className="mt-4 flex items-center gap-2">
        <Byline
          verb="answered"
          username={answer.author?.username ?? "Unknown"}
          timeAgo={timeAgo}
          agentLabel={answer.agentLabel}
        />
      </div>
    </>
  );
}

function AnswerCardEditButton() {
  const { setIsEditing } = useAnswerCardContext();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-xs text-muted-foreground"
      onClick={() => setIsEditing(true)}
    >
      Edit
    </Button>
  );
}

function AnswerCardContent({ children }: { children: React.ReactNode }) {
  const { isEditing } = useAnswerCardContext();
  if (isEditing) return <AnswerCardEditForm />;
  return <>{children}</>;
}

function AnswerCardEditForm() {
  const {
    answer,
    setIsEditing,
    setError,
    error,
    isPending,
    agentLabel,
    setAgentLabel,
    editorRef,
    handleEditSubmit,
  } = useAnswerCardContext();

  return (
    <form onSubmit={handleEditSubmit} className="space-y-3">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      <RichTextEditor
        ref={editorRef}
        initialJson={answer.body}
        placeholder="Edit your answer..."
        minHeight="120px"
      />
      <div className="flex items-center gap-2">
        <Select value={agentLabel} onValueChange={setAgentLabel}>
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
  );
}

interface AnswerCardCommentsProps {
  currentUserId?: string;
  isAdmin?: boolean;
}

function AnswerCardComments({
  currentUserId,
  isAdmin,
}: AnswerCardCommentsProps) {
  const { answer, questionId, canComment } = useAnswerCardContext();
  return (
    <CommentList
      comments={answer.comments}
      parentType="answer"
      parentId={answer.id}
      questionId={questionId}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      canComment={canComment}
    />
  );
}

function AnswerCardDeleteButton() {
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeleting,
    handleDeleteConfirm,
    error,
  } = useAnswerCardContext();
  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              This will permanently remove this answer and its comments. This
              action cannot be undone.
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
  );
}

function AnswerCardAcceptButton({ isAdmin }: { isAdmin?: boolean }) {
  const router = useRouter();
  const {
    answer,
    questionId,
    acceptedAnswerId,
    previousAcceptedAnswerIds,
    questionAuthorId,
    currentUserId,
  } = useAnswerCardContext();
  const [isPending, startTransition] = useTransition();

  const isAccepted = acceptedAnswerId === answer.id;
  const wasPreviouslyAccepted = previousAcceptedAnswerIds?.includes(answer.id);
  const canAccept =
    currentUserId && (questionAuthorId === currentUserId || isAdmin);

  const handleAccept = useCallback(() => {
    startTransition(() => {
      setChosenAnswer(questionId, answer.id).then(() => {
        router.refresh();
      });
    });
  }, [questionId, answer.id, router]);

  const handleUnaccept = useCallback(() => {
    startTransition(() => {
      unacceptAnswer(questionId, answer.id).then(() => {
        router.refresh();
      });
    });
  }, [questionId, answer.id, router]);

  if (!canAccept) {
    // Just show the indicator if accepted, but no button
    if (isAccepted) {
      return (
        <span className="text-xs text-green-600 font-medium">
          ✓ Accepted
        </span>
      );
    }
    if (wasPreviouslyAccepted) {
      return (
        <span className="text-xs text-muted-foreground">
          Previously accepted
        </span>
      );
    }
    return null;
  }

  if (isAccepted) {
    return (
      <>
        <span className="text-xs text-green-600 font-medium">
          ✓ Accepted
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-red-600"
          onClick={handleUnaccept}
          disabled={isPending}
        >
          {isPending ? "Un-accepting..." : "Unaccept"}
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground hover:text-green-600"
        onClick={handleAccept}
        disabled={isPending}
      >
        {isPending ? "Accepting..." : "Mark as answer"}
      </Button>
      {wasPreviouslyAccepted && (
        <span className="text-xs text-muted-foreground">
          (previously accepted)
        </span>
      )}
    </>
  );
}

export const AnswerCard = {
  Root: AnswerCardRoot,
  Votes: AnswerCardVotes,
  Body: AnswerCardBody,
  Content: AnswerCardContent,
  EditButton: AnswerCardEditButton,
  EditForm: AnswerCardEditForm,
  DeleteButton: AnswerCardDeleteButton,
  AcceptButton: AnswerCardAcceptButton,
  Comments: AnswerCardComments,
};

/** Client wrapper that provides handlers and composes the compound for use from server components. */
function AnswerCardComposed({
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
}: {
  answer: AnswerWithAuthor;
  questionId: string;
  userVote: 1 | -1 | null;
  currentUserId?: string;
  isAdmin?: boolean;
  canUpvote?: boolean;
  canDownvote?: boolean;
  canComment?: boolean;
  acceptedAnswerId?: string | null;
  previousAcceptedAnswerIds?: string[];
  questionAuthorId?: string;
}) {
  const router = useRouter();
  const canEdit =
    (currentUserId && answer.authorId === currentUserId) || isAdmin;

  const onUpdate = useCallback(
    (formData: FormData) =>
      updateAnswer(answer.id, questionId, undefined, formData).then(
        (result) => {
          if (!result?.error) router.refresh();
          return result ?? undefined;
        }
      ),
    [answer.id, questionId, router]
  );

  const onDelete = useCallback(
    () =>
      deleteAnswer(answer.id, questionId).then((result) => {
        if (!result?.error) router.refresh();
        return result;
      }),
    [answer.id, questionId, router]
  );

  return (
    <AnswerCard.Root
      answer={answer}
      questionId={questionId}
      userVote={userVote}
      onUpdate={onUpdate}
      onDelete={onDelete}
      canUpvote={canUpvote}
      canDownvote={canDownvote}
      isSignedIn={!!currentUserId}
      canComment={canComment}
      acceptedAnswerId={acceptedAnswerId}
      previousAcceptedAnswerIds={previousAcceptedAnswerIds}
      questionAuthorId={questionAuthorId}
      currentUserId={currentUserId}
    >
      <AnswerCard.Votes />
      <div className="flex-1 min-w-0">
        <AnswerCard.Content>
          <AnswerCard.Body />
          <div className="mt-4 flex items-center gap-2">
            <AnswerCard.AcceptButton isAdmin={isAdmin} />
            {canEdit && <AnswerCard.EditButton />}
            {isAdmin && <AnswerCard.DeleteButton />}
          </div>
          <AnswerCard.Comments
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        </AnswerCard.Content>
      </div>
    </AnswerCard.Root>
  );
}

export { AnswerCardComposed };