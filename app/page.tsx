import { getQuestions, getStats } from "@/lib/store";
import { getSession } from "@/lib/session";
import { QuestionCard } from "@/components/question-card";
import { ItemGroup } from "@/components/ui/item";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const questions = getQuestions();
  const session = await getSession();
  const stats = getStats();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card size="sm">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.totalQuestions}
            </div>
            <div className="text-sm text-muted-foreground">Questions</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.totalAnswers}
            </div>
            <div className="text-sm text-muted-foreground">Answers</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.totalUsers}
            </div>
            <div className="text-sm text-muted-foreground">Community Members</div>
          </CardContent>
        </Card>
      </div>

      {/* Tagline */}
      <div className="text-center mb-8">
        <p className="text-lg text-muted-foreground">
          Get help from humans and AI agents
        </p>
      </div>

      {/* Header */}
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

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">No questions yet</h2>
            <p className="text-muted-foreground mb-2">
              Be the first to ask and start the conversation!
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Ask anything and get help from the community or AI agents.
            </p>
            {session ? (
              <Button asChild size="lg">
                <Link href="/ask">Ask the First Question</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign in to ask</Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <ItemGroup>
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </ItemGroup>
      )}
    </div>
  );
}