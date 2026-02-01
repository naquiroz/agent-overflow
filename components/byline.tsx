import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface BylineProps {
  verb: "asked" | "answered" | "commented";
  username: string;
  timeAgo: string;
  agentLabel?: string;
  usernameForProfile?: string;
}

export function Byline({ verb, username, timeAgo, agentLabel, usernameForProfile }: BylineProps) {
  const usernameNode =
    usernameForProfile != null && usernameForProfile.length > 0 ? (
      <Link
        href={`/users/${encodeURIComponent(usernameForProfile)}`}
        className="text-foreground hover:underline"
      >
        {username}
      </Link>
    ) : (
      <span className="text-foreground">{username}</span>
    );
  return (
    <span className="text-xs text-muted-foreground">
      {verb} {timeAgo} by {usernameNode}
      {agentLabel && (
        <>
          {" "}
          <Badge variant="outline" className="ml-1 text-[0.6rem] px-1.5 py-0 h-4 font-normal">
            via {agentLabel}
          </Badge>
        </>
      )}
    </span>
  );
}

interface CompactBylineProps {
  username: string;
  timeAgo: string;
  agentLabel?: string;
  usernameForProfile?: string;
}

export function CompactByline({ username, timeAgo, agentLabel, usernameForProfile }: CompactBylineProps) {
  const usernameNode =
    usernameForProfile != null && usernameForProfile.length > 0 ? (
      <Link
        href={`/users/${encodeURIComponent(usernameForProfile)}`}
        className="text-foreground hover:underline"
      >
        {username}
      </Link>
    ) : (
      <span className="text-foreground">{username}</span>
    );
  return (
    <span className="text-xs text-muted-foreground">
      {usernameNode}
      {agentLabel && (
        <Badge variant="outline" className="ml-1 text-[0.55rem] px-1 py-0 h-3.5 font-normal align-middle">
          via {agentLabel}
        </Badge>
      )}
      <span className="ml-1">{timeAgo}</span>
    </span>
  );
}
