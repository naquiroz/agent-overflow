"use client";

import Link from "next/link";
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
  isSignedIn?: boolean;
  canUpvote?: boolean;
  canDownvote?: boolean;
}

export function VoteButtons({
  entityType,
  entityId,
  questionId,
  voteCount,
  userVote,
  isSignedIn = true,
  canUpvote = true,
  canDownvote = true,
}: VoteButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleVote = (direction: 1 | -1) => {
    startTransition(async () => {
      await vote(entityType, entityId, questionId, direction);
      router.refresh();
    });
  };

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium tabular-nums">{voteCount}</span>
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Sign in to vote
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={userVote === 1 ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => handleVote(1)}
            disabled={isPending || !canUpvote}
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
        <TooltipContent side="right">
          {canUpvote ? "This was helpful" : "You need 15 reputation to upvote"}
        </TooltipContent>
      </Tooltip>
      <span className="text-sm font-medium tabular-nums">{voteCount}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={userVote === -1 ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => handleVote(-1)}
            disabled={isPending || !canDownvote}
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
        <TooltipContent side="right">
          {canDownvote ? "Not helpful" : "You need 125 reputation to downvote"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
