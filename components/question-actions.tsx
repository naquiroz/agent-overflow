"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { Question, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { RichTextEditor, RichTextEditorRef } from "@/components/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateQuestion, deleteQuestion } from "@/lib/actions";
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

type QuestionWithAuthor = Question & { author: User | undefined };

interface QuestionActionsContextValue {
  question: QuestionWithAuthor;
  questionId: string;
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
  formRef: React.RefObject<HTMLFormElement | null>;
  editorRef: React.RefObject<RichTextEditorRef | null>;
  handleEditSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleDeleteConfirm: () => void;
  onUpdate: (formData: FormData) => Promise<{ error?: string } | void>;
  onDelete: () => Promise<{ error?: string } | void>;
}

const QuestionActionsContext =
  createContext<QuestionActionsContextValue | null>(null);

function useQuestionActionsContext() {
  const ctx = useContext(QuestionActionsContext);
  if (!ctx)
    throw new Error(
      "QuestionActions parts must be used within QuestionActions.Root"
    );
  return ctx;
}

interface QuestionActionsRootProps {
  question: QuestionWithAuthor;
  questionId: string;
  onUpdate: (formData: FormData) => Promise<{ error?: string } | void>;
  onDelete: () => Promise<{ error?: string } | void>;
  children: React.ReactNode;
}

function QuestionActionsRoot({
  question,
  questionId,
  onUpdate,
  onDelete,
  children,
}: QuestionActionsRootProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentLabel, setAgentLabel] = useState(
    question.agentLabel ?? "Human in the loop"
  );
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);

  const handleEditSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      const form = formRef.current;
      const editor = editorRef.current;
      if (!form || !editor) return;

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
          setError("Body must be at least 20 characters");
          return;
        }
      } catch {
        setError("Invalid editor content");
        return;
      }

      const formData = new FormData(form);
      formData.set("body", json);
      formData.set("agentLabel", agentLabel);

      const title = (formData.get("title") as string) || "";
      if (title.length < 10) {
        setError("Title must be at least 10 characters");
        return;
      }

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

  const value: QuestionActionsContextValue = {
    question,
    questionId,
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
    formRef,
    editorRef,
    handleEditSubmit,
    handleDeleteConfirm,
    onUpdate,
    onDelete,
  };

  return (
    <QuestionActionsContext.Provider value={value}>
      <div className="flex flex-col gap-2 w-full">{children}</div>
    </QuestionActionsContext.Provider>
  );
}

function QuestionActionsEditButton() {
  const { setIsEditing } = useQuestionActionsContext();
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

function QuestionActionsDeleteButton() {
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeleting,
    handleDeleteConfirm,
    error,
    isEditing,
  } = useQuestionActionsContext();
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
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the question, all answers, and all
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
      {error && !isEditing && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </>
  );
}

function QuestionActionsEditForm() {
  const {
    isEditing,
    question,
    setIsEditing,
    setError,
    error,
    isPending,
    agentLabel,
    setAgentLabel,
    formRef,
    editorRef,
    handleEditSubmit,
  } = useQuestionActionsContext();

  if (!isEditing) return null;

  return (
    <div className="mt-2 p-4 border border-border rounded-lg bg-muted/20 w-full max-w-2xl">
      <form ref={formRef} onSubmit={handleEditSubmit} className="space-y-4">
        {error && (
          <FieldError className="text-sm bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </FieldError>
        )}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="edit-title">Title</FieldLabel>
            <Input
              id="edit-title"
              name="title"
              type="text"
              defaultValue={question.title}
              required
              minLength={10}
            />
          </Field>
          <Field>
            <FieldLabel>Body</FieldLabel>
            <RichTextEditor
              ref={editorRef}
              initialJson={question.body}
              placeholder="Question body"
              minHeight="200px"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-tags">Tags</FieldLabel>
            <Input
              id="edit-tags"
              name="tags"
              type="text"
              defaultValue={question.tags.join(", ")}
              placeholder="e.g. react, typescript (comma separated)"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-agentLabel">Post as</FieldLabel>
            <Select value={agentLabel} onValueChange={setAgentLabel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal">
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
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}

export const QuestionActions = {
  Root: QuestionActionsRoot,
  EditButton: QuestionActionsEditButton,
  DeleteButton: QuestionActionsDeleteButton,
  EditForm: QuestionActionsEditForm,
};

/** Client wrapper that provides handlers and composes the compound for use from server components. */
function QuestionActionsComposed({
  question,
  questionId,
  currentUserId,
  isAdmin,
}: {
  question: QuestionWithAuthor;
  questionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const canEdit =
    currentUserId &&
    (question.authorId === currentUserId || isAdmin);
  const canDelete = isAdmin;

  const onUpdate = useCallback(
    (formData: FormData) =>
      updateQuestion(questionId, undefined, formData).then((result) => {
        if (!result?.error) router.refresh();
        return result ?? undefined;
      }),
    [questionId, router]
  );

  const onDelete = useCallback(
    () =>
      deleteQuestion(questionId).then((result) => {
        if (!result?.error) router.push("/");
        return result;
      }),
    [questionId, router]
  );

  if (!canEdit && !canDelete) return null;

  return (
    <QuestionActions.Root
      question={question}
      questionId={questionId}
      onUpdate={onUpdate}
      onDelete={onDelete}
    >
      <div className="flex items-center gap-2">
        {canEdit && <QuestionActions.EditButton />}
        {canDelete && <QuestionActions.DeleteButton />}
      </div>
      <QuestionActions.EditForm />
    </QuestionActions.Root>
  );
}

export { QuestionActionsComposed };
