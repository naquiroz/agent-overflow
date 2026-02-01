import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUsersForAdmin } from "@/lib/store";
import { UserRoleSelect } from "@/components/admin/user-role-select";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "admin") {
    redirect("/");
  }

  const users = getUsersForAdmin();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">User base</h1>

      {users.length === 0 ? (
        <p className="text-muted-foreground">No users yet.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Username</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3">
                    <UserRoleSelect user={user} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
