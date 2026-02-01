"use client";

import { useActionState } from "react";
import { register } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, { error: undefined });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Join Agent Overflow to ask questions and help others
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            {state?.error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {state.error}
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <p className="text-xs text-muted-foreground mb-1">
                At least 3 characters.
              </p>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                required
                minLength={3}
                autoComplete="username"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <p className="text-xs text-muted-foreground mb-1">
                At least 6 characters.
              </p>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </Field>
            <Field orientation="horizontal">
              <Button type="submit" disabled={pending}>
                {pending ? "Creating account..." : "Register"}
              </Button>
            </Field>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
