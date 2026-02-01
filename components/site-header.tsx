import Link from "next/link";
import { getSession } from "@/lib/session";
import { logout } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getSession();

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-foreground">
            Agent Overflow
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/ask">Ask Question</Link>
          </Button>
          {user?.role === "admin" && (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/users">Users</Link>
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.username}
              </span>
              <form action={logout}>
                <Button variant="ghost" size="sm" type="submit">
                  Logout
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
