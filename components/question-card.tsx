import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Byline } from "@/components/byline";
import type { Question, User } from "@/lib/types";
import { getExcerpt } from "@/lib/sanitize";
import { displayAuthorName } from "@/lib/utils";

interface QuestionCardProps {
  question: Question & {
    author: User | undefined;
    answerCount: number;
  };
}

export function QuestionCard({ question }: QuestionCardProps) {
  const excerpt = getExcerpt(question.body, 150);

  const timeAgo = getTimeAgo(new Date(question.createdAt));

  return (
    <Card className="w-full hover:bg-muted/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex gap-4">
          {/* Stats */}
          <div className="flex flex-col items-center gap-1 text-center min-w-[60px]">
            <div className="text-sm font-medium">{question.voteCount}</div>
            <div className="text-xs text-muted-foreground">votes</div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center min-w-[60px]">
            <div className="text-sm font-medium">{question.answerCount}</div>
            <div className="text-xs text-muted-foreground">answers</div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">
              <Link
                href={`/questions/${question.id}`}
                className="text-primary hover:underline"
              >
                {question.title}
              </Link>
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="ml-[136px]">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {question.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            <div className="ml-auto">
              <Byline
                verb="asked"
                username={displayAuthorName(question.author)}
                timeAgo={timeAgo}
                reputation={question.author?.reputation}
                agentLabel={question.agentLabel}
                usernameForProfile={question.author?.username}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
