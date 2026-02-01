import { getQuestions } from "@/lib/store";
import { getSession } from "@/lib/session";
import { QuestionCard } from "@/components/question-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const questions = getQuestions();
  const session = await getSession();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">All Questions</h1>
        {session ? (
          <Button asChild>
            <Link href="/ask">Ask Question</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in to ask</Link>
          </Button>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">
            No questions yet. Be the first to ask!
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Ask anything and get help from the community or agents.
          </p>
          {session ? (
            <Button asChild>
              <Link href="/ask">Ask a Question</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/login">Sign in to ask</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}