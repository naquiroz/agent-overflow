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
import type { Comment, User } from "@/lib/types";
import { CompactByline } from "@/components/byline";
import { BodyContent } from "@/components/body-content";
import { Button } from "@/components/ui/button";
import { RichTextEditor, RichTextEditorRef } from "@/components/rich-text-editor";
import { updateComment, deleteComment } from "@/lib/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getTimeAgo } from "@/lib/utils";
import { extractTextContent } from "@/lib/lexical-utils";

type CommentWithAuthor = Comment & { author: User | undefined };

interface CommentItemContextValue {
  comment: CommentWithAuthor;
  questionId: string;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (v: boolean) => void;
  isPending: boolean;
  isDeleting: boolean;
  error: string | null;
  setError: (v: string | null) => void;
  timeAgo: string;
  editBodyDisplay: string;
  editorRef: React.RefObject<RichTextEditorRef | null>;
  handleEditSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleDeleteConfirm: () => void;
  onUpdate: (formData: FormData) => Promise<{ error?: string } | void>;
  onDelete: () => Promise<{ error?: string } | void>;
}

const CommentItemContext = createContext<CommentItemContextValue | null>(null);

function useCommentItemContext() {
  const ctx = useContext(CommentItemContext);
  if (!ctx)
    throw new Error("CommentItem parts must be used within CommentItem.Root");
  return ctx;
}

interface CommentItemRootProps {
  comment: CommentWithAuthor;
  questionId: string;
  onUpdate: (formData: FormData) => Promise<{ error?: string } | void>;
  onDelete: () => Promise<{ error?: string } | void>;
  children: React.ReactNode;
}

function CommentItemRoot({
  comment,
  questionId,
  onUpdate,
  onDelete,
  children,
}: CommentItemRootProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<RichTextEditorRef>(null);
  const timeAgo = getTimeAgo(new Date(comment.createdAt));
  const editBodyDisplay = extractTextContent(comment.body) || comment.body;

  const handleEditSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
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
          setError("Comment must be at least 5 characters");
          return;
        }
      } catch {
        setError("Invalid editor content");
        return;
      }
      
      const formData = new FormData(e.currentTarget);
      formData.set("body", json);
      startTransition(() => {
        onUpdate(formData).then((result) => {
          if (result?.error) setError(result.error);
          else setIsEditing(false);
        });
      });
    },
    [onUpdate]
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

  const value: CommentItemContextValue = {
    comment,
    questionId,
    isEditing,
    setIsEditing,
    deleteDialogOpen,
    setDeleteDialogOpen,
    isPending,
    isDeleting,
    error,
    setError,
    timeAgo,
    editBodyDisplay,
    editorRef,
    handleEditSubmit,
    handleDeleteConfirm,
    onUpdate,
    onDelete,
  };

  return (
    <CommentItemContext.Provider value={value}>
      <div className="text-sm text-muted-foreground border-b border-border/50 pb-2">
        {children}
      </div>
    </CommentItemContext.Provider>
  );
}

function CommentItemBody() {
  const { comment, timeAgo } = useCommentItemContext();
  return (
    <>
      <BodyContent body={comment.body} className="inline text-sm" />
      <span className="mx-1">–</span>
      <CompactByline
        username={comment.author?.username ?? "Unknown"}
        timeAgo={timeAgo}
        agentLabel={comment.agentLabel}
      />
      {comment.updatedAt && (
        <span className="ml-1 text-muted-foreground/80">(edited)</span>
      )}
    </>
  );
}

function CommentItemContent({ children }: { children: React.ReactNode }) {
  const { isEditing } = useCommentItemContext();
  if (isEditing) return <CommentItemEditForm />;
  return <>{children}</>;
}

function CommentItemEditForm() {
  const {
    comment,
    setIsEditing,
    setError,
    error,
    isPending,
    editorRef,
    handleEditSubmit,
  } = useCommentItemContext();
  return (
    <form onSubmit={handleEditSubmit} className="space-y-2">
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
          {error}
        </div>
      )}
      <RichTextEditor
        ref={editorRef}
        initialJson={comment.body}
        placeholder="Edit your comment..."
        minHeight="60px"
        className="text-sm"
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
  );
}

function CommentItemEditButton() {
  const { setIsEditing } = useCommentItemContext();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
      onClick={() => setIsEditing(true)}
    >
      Edit
    </Button>
  );
}

function CommentItemDeleteButton() {
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeleting,
    handleDeleteConfirm,
  } = useCommentItemContext();
  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto p-0 text-xs text-destructive hover:text-destructive"
        onClick={() => setDeleteDialogOpen(true)}
      >
        Delete
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete comment?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove this comment. This action cannot be
            undone.
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
  );
}

export const CommentItem = {
  Root: CommentItemRoot,
  Body: CommentItemBody,
  Content: CommentItemContent,
  EditForm: CommentItemEditForm,
  EditButton: CommentItemEditButton,
  DeleteButton: CommentItemDeleteButton,
};

/** Client wrapper that provides handlers and composes the compound for use from CommentList. */
function CommentItemComposed({
  comment,
  questionId,
  currentUserId,
  isAdmin,
}: {
  comment: CommentWithAuthor;
  questionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const canEdit =
    currentUserId && (comment.authorId === currentUserId || isAdmin);
  const canDelete = isAdmin;

  const onUpdate = useCallback(
    (formData: FormData) =>
      updateComment(comment.id, questionId, undefined, formData).then(
        (result) => {
          if (!result?.error) router.refresh();
          return result ?? undefined;
        }
      ),
    [comment.id, questionId, router]
  );

  const onDelete = useCallback(
    () =>
      deleteComment(comment.id, questionId).then((result) => {
        if (!result?.error) router.refresh();
        return result;
      }),
    [comment.id, questionId, router]
  );

  return (
    <CommentItem.Root
      comment={comment}
      questionId={questionId}
      onUpdate={onUpdate}
      onDelete={onDelete}
    >
      <CommentItem.Content>
        <CommentItem.Body />
        {(canEdit || canDelete) && (
          <span className="ml-2">
            {canEdit && <CommentItem.EditButton />}
            {canEdit && canDelete && <span className="mx-1">·</span>}
            {canDelete && <CommentItem.DeleteButton />}
          </span>
        )}
      </CommentItem.Content>
    </CommentItem.Root>
  );
}

export { CommentItemComposed };
