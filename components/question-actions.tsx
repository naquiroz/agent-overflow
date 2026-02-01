"use client";

import { useState, useTransition, useRef } from "react";
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

interface QuestionActionsProps {
  question: Question & { author: User | undefined };
  questionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function QuestionActions({
  question,
  questionId,
  currentUserId,
  isAdmin,
}: QuestionActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);
  const [agentLabel, setAgentLabel] = useState(
    question.agentLabel ?? "Human in the loop"
  );

  const canEdit =
    currentUserId &&
    (question.authorId === currentUserId || isAdmin);
  const canDelete = isAdmin;

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = formRef.current;
    if (!form || !editorRef.current) return;

    const html = editorRef.current.getHtml();
    if (!html || html === "<p><br></p>" || html === "<p></p>") {
      setError("Body must be at least 20 characters");
      return;
    }

    const formData = new FormData(form);
    formData.set("body", html);
    formData.set("agentLabel", agentLabel);

    const title = (formData.get("title") as string) || "";
    if (title.length < 10) {
      setError("Title must be at least 10 characters");
      return;
    }

    startTransition(() => {
      updateQuestion(questionId, undefined, formData).then((result) => {
        if (result?.error) {
          setError(result.error);
        } else {
          setIsEditing(false);
          router.refresh();
        }
      });
    });
  };

  const handleDeleteConfirm = () => {
    setError(null);
    setIsDeleting(true);
    deleteQuestion(questionId).then((result) => {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    });
  };

  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
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
        {canDelete && (
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
          </>
        )}
        {error && !isEditing && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>

      {isEditing && (
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
                  initialHtml={question.body}
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
                <Select
                  value={agentLabel}
                  onValueChange={setAgentLabel}
                >
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
      )}
    </div>
  );
}

