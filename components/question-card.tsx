import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import { CompactByline } from "@/components/byline";
import type { Question, User } from "@/lib/types";
import { getExcerpt } from "@/lib/sanitize";
import { displayAuthorName } from "@/lib/utils";
import { getTimeAgo } from "@/lib/utils";

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
    <Item variant="outline">
      <Link href={`/questions/${question.id}`} className="flex gap-4 w-full hover:bg-muted/50 -m-2.5 p-2.5 rounded-md transition-colors">
        {/* Stats Column - Vertically Stacked */}
        <div className="flex flex-col gap-2 text-xs shrink-0 text-right min-w-[100px]">
          <div className="text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{question.voteCount}</span> votes
          </div>
          <div className={`${question.answerCount > 0 ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
            <span className="font-semibold tabular-nums">{question.answerCount}</span> answers
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <ItemTitle className="text-base font-semibold leading-tight hover:text-primary">
            {question.title}
          </ItemTitle>
          <ItemDescription className="text-xs">{excerpt}</ItemDescription>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {question.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <CompactByline
              username={displayAuthorName(question.author)}
              timeAgo={timeAgo}
              agentLabel={question.agentLabel}
              usernameForProfile={question.author?.username}
            />
          </div>
        </div>
      </Link>
    </Item>
  );
}
