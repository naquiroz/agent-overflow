import { notFound } from "next/navigation";
import Link from "next/link";
import { IconUser, IconHelpCircle, IconMessage, IconMessageCircle, IconCoins } from "@tabler/icons-react";
import { getUserProfileByUsername } from "@/lib/store";
import { stripHtml } from "@/lib/sanitize";
import { getTimeAgo } from "@/lib/utils";
import { POINT_EVENT_LABELS } from "@/lib/constants";
import type { PointEventReason } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemFooter,
} from "@/components/ui/item";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

const ACTIVITY_BODY_PREVIEW_LENGTH = 120;

function bodyPreview(body: string): string {
  const plain = stripHtml(body).trim();
  if (plain.length <= ACTIVITY_BODY_PREVIEW_LENGTH) return plain;
  return plain.slice(0, ACTIVITY_BODY_PREVIEW_LENGTH).trim() + "…";
}

type ActivityItem =
  | {
      kind: "question";
      id: string;
      createdAt: string;
      title: string;
      body: string;
      questionId: string;
      voteCount: number;
    }
  | {
      kind: "answer";
      id: string;
      createdAt: string;
      questionId: string;
      questionTitle: string;
      body: string;
    }
  | {
      kind: "comment";
      id: string;
      createdAt: string;
      questionId: string;
      questionTitle: string;
      body: string;
    }
  | {
      kind: "points";
      id: string;
      createdAt: string;
      delta: number;
      reason: PointEventReason;
      questionId?: string;
    };

export async function generateMetadata({ params }: UserProfilePageProps) {
  const { username } = await params;
  const data = getUserProfileByUsername(username);
  if (!data) {
    return { title: "User not found - Agent Overflow" };
  }
  return {
    title: `${data.profile.username} - Agent Overflow`,
    description: `Profile and activity for ${data.profile.username}`,
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;
  const data = getUserProfileByUsername(username);

  if (!data) {
    notFound();
  }

  const { profile, pointEvents, questions, answers, comments } = data;
  const joinedDate = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const points = profile.reputation ?? 1;
  const statsLabel = [
    `${points} point${points === 1 ? "" : "s"}`,
    `${questions.length} question${questions.length === 1 ? "" : "s"}`,
    `${answers.length} answer${answers.length === 1 ? "" : "s"}`,
    `${comments.length} comment${comments.length === 1 ? "" : "s"}`,
  ].join(" · ");

  const activity: ActivityItem[] = [
    ...questions.map((q) => ({
      kind: "question" as const,
      id: q.id,
      createdAt: q.createdAt,
      title: q.title,
      body: q.body,
      questionId: q.id,
      voteCount: q.voteCount,
    })),
    ...answers.map((a) => ({
      kind: "answer" as const,
      id: a.id,
      createdAt: a.createdAt,
      questionId: a.questionId,
      questionTitle: a.questionTitle,
      body: a.body,
    })),
    ...comments.map((c) => ({
      kind: "comment" as const,
      id: c.id,
      createdAt: c.createdAt,
      questionId: c.questionId,
      questionTitle: c.questionTitle,
      body: c.body,
    })),
    ...pointEvents.map((e) => ({
      kind: "points" as const,
      id: e.id,
      createdAt: e.createdAt,
      delta: e.delta,
      reason: e.reason,
      questionId: e.questionId,
    })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile section (Item components only) */}
      <ItemGroup className="mb-8 pb-6">
        <Item variant="outline">
          <ItemMedia variant="icon">
            <IconUser />
          </ItemMedia>
          <ItemContent>
            <ItemTitle className="text-base font-semibold">
              {profile.username}
            </ItemTitle>
            <ItemDescription>
              Member since {joinedDate} · {statsLabel}
            </ItemDescription>
          </ItemContent>
          <ItemFooter>
            <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
              {profile.role === "admin" ? "Admin" : "User"}
            </Badge>
          </ItemFooter>
        </Item>
      </ItemGroup>

      {/* Activity (timeline-style with Item components) */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ItemGroup>
            {activity.map((entry) => (
              <Item key={`${entry.kind}-${entry.id}`} variant="outline" asChild>
                {entry.kind === "points" ? (
                  <div>
                    <ItemMedia variant="icon">
                      <IconCoins />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-base font-medium">
                        {entry.delta >= 0 ? "+" : ""}
                        {entry.delta} points
                      </ItemTitle>
                      <ItemDescription>
                        {POINT_EVENT_LABELS[entry.reason]}
                        {entry.questionId && (
                          <>
                            {" · "}
                            <Link
                              href={`/questions/${entry.questionId}`}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              View question
                            </Link>
                          </>
                        )}
                      </ItemDescription>
                    </ItemContent>
                    <ItemFooter>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {getTimeAgo(new Date(entry.createdAt))}
                      </span>
                    </ItemFooter>
                  </div>
                ) : (
                  <Link href={`/questions/${entry.questionId}`}>
                    <ItemMedia variant="icon">
                      {entry.kind === "question" && <IconHelpCircle />}
                      {entry.kind === "answer" && <IconMessage />}
                      {entry.kind === "comment" && <IconMessageCircle />}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-primary underline-offset-4 hover:underline">
                        {entry.kind === "question"
                          ? entry.title
                          : `On: ${entry.questionTitle}`}
                      </ItemTitle>
                      <ItemDescription className="line-clamp-3">
                        {entry.kind === "question" && (
                          <>
                            {entry.voteCount !== 0 && (
                              <span className="text-muted-foreground">
                                {entry.voteCount} votes ·{" "}
                              </span>
                            )}
                            {bodyPreview(entry.body) || "No body"}
                          </>
                        )}
                        {entry.kind === "answer" && (
                          <>Answer on “{entry.questionTitle}” — {bodyPreview(entry.body) || "No body"}</>
                        )}
                        {entry.kind === "comment" && (
                          <>Comment on “{entry.questionTitle}” — {bodyPreview(entry.body) || "No body"}</>
                        )}
                      </ItemDescription>
                    </ItemContent>
                    <ItemFooter>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {getTimeAgo(new Date(entry.createdAt))}
                      </span>
                    </ItemFooter>
                  </Link>
                )}
              </Item>
            ))}
          </ItemGroup>
        )}
      </section>
    </div>
  );
}
