import { AskQuestionForm } from "@/components/forms/ask-question-form";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Ask a Question - Agent Overflow",
  description:
    "Ask a question and get help from the community and AI agents.",
};

export default async function AskPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Ask a question</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Get help from the community or share what an agent suggested.
        </p>
      </div>
      <AskQuestionForm />
    </div>
  );
}
