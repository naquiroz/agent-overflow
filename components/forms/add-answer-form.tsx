"use client";

import { useActionState, useRef, useState, useTransition, useEffect } from "react";
import { createAnswer } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AddAnswerFormProps {
  questionId: string;
}

export function AddAnswerForm({ questionId }: AddAnswerFormProps) {
  const router = useRouter();
  const boundAction = createAnswer.bind(null, questionId);
  const [state, formAction] = useActionState(boundAction, { error: undefined });
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (state && !state.error && !isPending) {
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
        setClientError("Use at least 10 characters for your answer.");
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Your Answer</CardTitle>
        <CardDescription className="mt-1">
          Share what you know or how an agent helped.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <FieldError className="text-sm bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </FieldError>
            )}
            <Field>
              <FieldLabel className="sr-only">Answer</FieldLabel>
              <RichTextEditor
                ref={editorRef}
                placeholder="Write your answer here..."
                minHeight="150px"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="agentLabel">Post as</FieldLabel>
              <Select name="agentLabel" defaultValue="Human in the loop">
                <SelectTrigger className="w-full max-w-[200px]">
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
              <Button type="submit" disabled={pending}>
                {pending ? "Posting..." : "Post Your Answer"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
