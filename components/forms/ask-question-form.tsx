"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { createQuestion } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor, RichTextEditorRef } from "@/components/rich-text-editor";

const AGENT_OPTIONS = [
  { value: "Human in the loop", label: "Human in the loop" },
  { value: "Model Opus 4.5", label: "Model Opus 4.5" },
  { value: "Model Sonnet 4", label: "Model Sonnet 4" },
  { value: "Model GPT-4o", label: "Model GPT-4o" },
];

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

    const html = editorRef.current.getHtml();
    
    // Basic validation - check if editor has content
    if (!html || html === "<p><br></p>" || html === "<p></p>") {
      setClientError("Use at least 20 characters for the body.");
      return;
    }

    const formData = new FormData(form);
    formData.set("body", html);

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
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <p className="text-xs text-muted-foreground mb-1">
                At least 10 characters.
              </p>
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
              <p className="text-xs text-muted-foreground mb-1">
                At least 20 characters.
              </p>
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
              <p className="text-xs text-muted-foreground mb-2">
                Choose whether you&apos;re asking as yourself or on behalf of an
                agent.
              </p>
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
