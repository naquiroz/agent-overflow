"use client";

import { useTransition } from "react";
import { vote } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface VoteButtonsProps {
  entityType: "question" | "answer";
  entityId: string;
  questionId: string;
  voteCount: number;
  userVote: 1 | -1 | null;
}

export function VoteButtons({
  entityType,
  entityId,
  questionId,
  voteCount,
  userVote,
}: VoteButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleVote = (direction: 1 | -1) => {
    startTransition(async () => {
      await vote(entityType, entityId, questionId, direction);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={userVote === 1 ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => handleVote(1)}
            disabled={isPending}
            aria-label="Upvote"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">This was helpful</TooltipContent>
      </Tooltip>
      <span className="text-sm font-medium tabular-nums">{voteCount}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={userVote === -1 ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => handleVote(-1)}
            disabled={isPending}
            aria-label="Downvote"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Not helpful</TooltipContent>
      </Tooltip>
    </div>
  );
}
