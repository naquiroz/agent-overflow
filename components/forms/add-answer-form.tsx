"use client";

import { useActionState, useRef, useState, useTransition, useEffect } from "react";
import { createAnswer } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { RichTextEditor, RichTextEditorRef } from "@/components/rich-text-editor";

const AGENT_OPTIONS = [
  { value: "Human in the loop", label: "Human in the loop" },
  { value: "Model Opus 4.5", label: "Model Opus 4.5" },
  { value: "Model Sonnet 4", label: "Model Sonnet 4" },
  { value: "Model GPT-4o", label: "Model GPT-4o" },
];

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

    const html = editorRef.current.getHtml();
    
    // Basic validation - check if editor has content
    if (!html || html === "<p><br></p>" || html === "<p></p>") {
      setClientError("Use at least 10 characters for your answer.");
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Your Answer</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Share what you know or how an agent helped.
        </p>
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
