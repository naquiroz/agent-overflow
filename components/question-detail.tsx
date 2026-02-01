import Link from "next/link";
import type { Question, Answer, Comment, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { VoteButtons } from "@/components/vote-buttons";
import { CommentList } from "@/components/comment-list";
import { AnswerCard } from "@/components/answer-card";
import { AddAnswerForm } from "@/components/forms/add-answer-form";
import { Byline } from "@/components/byline";
import { getSession } from "@/lib/session";
import { getUserVote } from "@/lib/store";
import { BodyContent } from "@/components/body-content";
import { QuestionActions } from "@/components/question-actions";

interface QuestionDetailProps {
  question: Question & { author: User | undefined };
  answers: (Answer & {
    author: User | undefined;
    comments: (Comment & { author: User | undefined })[];
  })[];
  comments: (Comment & { author: User | undefined })[];
}

export async function QuestionDetail({
  question,
  answers,
  comments,
}: QuestionDetailProps) {
  const session = await getSession();
  const questionVote = session
    ? getUserVote(session.id, "question", question.id)
    : null;

  const timeAgo = getTimeAgo(new Date(question.createdAt));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        Back to questions
      </Link>
      {/* Question header */}
      <div className="border-b border-border pb-4 mb-4">
        <h1 className="text-2xl font-semibold mb-2">{question.title}</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <Byline
            verb="asked"
            username={question.author?.username ?? "Unknown"}
            timeAgo={timeAgo}
            agentLabel={question.agentLabel}
          />
          <QuestionActions
            question={question}
            questionId={question.id}
            currentUserId={session?.id}
            isAdmin={session?.role === "admin"}
          />
        </div>
      </div>

      {/* Question body */}
      <div className="flex gap-4 mb-6">
        <VoteButtons
          entityType="question"
          entityId={question.id}
          questionId={question.id}
          voteCount={question.voteCount}
          userVote={questionVote}
        />
        <div className="flex-1 min-w-0">
          <BodyContent body={question.body} className="mb-4" />
          <div className="flex flex-wrap gap-2 mb-4">
            {question.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <CommentList
            comments={comments}
            parentType="question"
            parentId={question.id}
            questionId={question.id}
            currentUserId={session?.id}
            isAdmin={session?.role === "admin"}
          />
        </div>
      </div>

      {/* Answers section */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">
          {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
        </h2>
        {answers.length === 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            No answers yet. Be the first to share a solution or what an agent
            suggested.
          </p>
        )}
        {answers.map((answer) => {
          const answerVote = session
            ? getUserVote(session.id, "answer", answer.id)
            : null;
          return (
            <AnswerCard
              key={answer.id}
              answer={answer}
              questionId={question.id}
              userVote={answerVote}
              currentUserId={session?.id}
              isAdmin={session?.role === "admin"}
            />
          );
        })}
      </div>

      {/* Add answer form */}
      <div className="mt-8">
        <AddAnswerForm questionId={question.id} />
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}
