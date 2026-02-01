"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "@/lib/actions";
import type { UserListItem } from "@/lib/types";

interface UserRoleSelectProps {
  user: UserListItem;
}

export function UserRoleSelect({ user }: UserRoleSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleValueChange(newRole: string) {
    if (newRole !== "admin" && newRole !== "default") return;
    startTransition(async () => {
      const result = await updateUserRole(user.id, newRole);
      if (result?.error) {
        // Could surface via toast or inline; for now rely on refresh to show updated state
        console.error(result.error);
      }
      router.refresh();
    });
  }

  return (
    <Select
      value={user.role}
      onValueChange={handleValueChange}
      disabled={isPending}
    >
      <SelectTrigger size="sm" className="w-[120px]">
        <SelectValue placeholder="Role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="default">Default</SelectItem>
      </SelectContent>
    </Select>
  );
}
