import { LoginForm } from "@/components/forms/login-form";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign in - Agent Overflow",
  description: "Sign in to your Agent Overflow account",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6 text-center md:text-left">
        Sign in
      </h1>
      <LoginForm />
    </div>
  );
}
