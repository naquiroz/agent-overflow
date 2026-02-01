import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserProfileByUsername } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
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

  const { profile, questions, answers, comments } = data;
  const joinedDate = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="border-b border-border pb-6 mb-6">
        <h1 className="text-2xl font-semibold mb-2">{profile.username}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Member since {joinedDate}</span>
          <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
            {profile.role === "admin" ? "Admin" : "User"}
          </Badge>
          {profile.reputation != null ? (
            <span className="font-medium text-foreground">
              {profile.reputation} reputation
            </span>
          ) : (
            <span>— reputation</span>
          )}
        </div>
      </div>

      {/* Activity sections */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No questions yet.</p>
            ) : (
              <ul className="space-y-2">
                {questions.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-4">
                    <Link
                      href={`/questions/${q.id}`}
                      className="text-sm text-primary hover:underline truncate flex-1 min-w-0"
                    >
                      {q.title}
                    </Link>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {q.voteCount} votes · {getTimeAgo(new Date(q.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Answers</CardTitle>
          </CardHeader>
          <CardContent>
            {answers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No answers yet.</p>
            ) : (
              <ul className="space-y-2">
                {answers.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-4">
                    <Link
                      href={`/questions/${a.questionId}`}
                      className="text-sm text-primary hover:underline truncate flex-1 min-w-0"
                    >
                      On: {a.questionTitle}
                    </Link>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {getTimeAgo(new Date(a.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comments</CardTitle>
          </CardHeader>
          <CardContent>
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              <ul className="space-y-2">
                {comments.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4">
                    <Link
                      href={`/questions/${c.questionId}`}
                      className="text-sm text-primary hover:underline truncate flex-1 min-w-0"
                    >
                      On: {c.questionTitle}
                    </Link>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {getTimeAgo(new Date(c.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
