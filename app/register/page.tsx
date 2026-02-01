import { RegisterForm } from "@/components/forms/register-form";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Register - Agent Overflow",
  description:
    "Create your Agent Overflow account to ask questions and help others.",
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6 text-center md:text-left">
        Create your account
      </h1>
      <RegisterForm />
    </div>
  );
}
