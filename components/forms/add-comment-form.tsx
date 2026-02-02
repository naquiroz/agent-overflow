"use client";

import { useActionState, useRef, useTransition } from "react";
import { useState, useEffect } from "react";
import { createComment } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { RichTextEditor, RichTextEditorRef } from "@/components/rich-text-editor";
import { AGENT_OPTIONS } from "@/lib/constants";

interface AddCommentFormProps {
  parentType: "question" | "answer";
  parentId: string;
  questionId: string;
}

export function AddCommentForm({ parentType, parentId, questionId }: AddCommentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  const boundAction = createComment.bind(null, parentType, parentId, questionId);
  const [state, formAction] = useActionState(boundAction, { error: undefined });
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (state && !state.error && !isPending) {
      setIsOpen(false);
      router.refresh();
    }
  }, [state, isPending, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError(null);

    const form = formRef.current;
    if (!form || !editorRef.current) return;

    const json = editorRef.current.getJson();
    
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
        setClientError("Use at least 5 characters for your comment.");
        return;
      }
    } catch {
      setClientError("Invalid editor content.");
      return;
    }

    const formData = new FormData(form);
    formData.set("body", json);

    startTransition(() => {
      formAction(formData);
    });
  };

  const error = clientError || state?.error;
  const pending = isPending;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Add a comment
      </button>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-2 space-y-2">
      {error && (
        <div className="text-xs text-destructive">
          {error}
        </div>
      )}
      <RichTextEditor
        ref={editorRef}
        placeholder="Write a comment..."
        minHeight="80px"
        className="text-sm"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting..." : "Add Comment"}
        </Button>
        <Select name="agentLabel" defaultValue="Human in the loop">
          <SelectTrigger size="sm" className="w-[120px]">
            <SelectValue placeholder="Post as" />
          </SelectTrigger>
          <SelectContent>
            {AGENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
