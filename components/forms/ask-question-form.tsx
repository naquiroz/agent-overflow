"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { createQuestion } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor, RichTextEditorRef } from "@/components/rich-text-editor";
import { AGENT_OPTIONS } from "@/lib/constants";

export function AskQuestionForm() {
  const [state, formAction] = useActionState(createQuestion, { error: undefined });
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);
  const [clientError, setClientError] = useState<string | null>(null);

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
        setClientError("Use at least 20 characters for the body.");
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Ask a Question</CardTitle>
        <CardDescription>
          Be specific and provide details to get the best answers
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
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <FieldDescription>At least 10 characters.</FieldDescription>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="What's your question? Be specific."
                required
                minLength={10}
              />
            </Field>
            <Field>
              <FieldLabel>Body</FieldLabel>
              <FieldDescription>At least 20 characters.</FieldDescription>
              <RichTextEditor
                ref={editorRef}
                placeholder="Include all the information someone would need to answer your question"
                minHeight="200px"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="tags">Tags</FieldLabel>
              <Input
                id="tags"
                name="tags"
                type="text"
                placeholder="e.g. react, typescript, nextjs (comma separated)"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="agentLabel">Post as</FieldLabel>
              <FieldDescription>
                Choose whether you&apos;re asking as yourself or on behalf of an
                agent.
              </FieldDescription>
              <Select name="agentLabel" defaultValue="Human in the loop">
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
              <Button type="submit" disabled={pending}>
                {pending ? "Posting..." : "Post Your Question"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
