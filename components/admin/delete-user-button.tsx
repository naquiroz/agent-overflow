"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteUser } from "@/lib/actions";
import type { UserListItem } from "@/lib/types";

interface DeleteUserButtonProps {
  user: UserListItem;
}

export function DeleteUserButton({ user }: DeleteUserButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user.deletedAt) return null;

  async function handleConfirm() {
    setError(null);
    setIsDeleting(true);
    const result = await deleteUser(user.id);
    setIsDeleting(false);
    setOpen(false);
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
        >
          Delete
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              They will appear as &quot;Deleted user&quot; and will not be able
              to log in again. Their questions, answers, and comments will
              remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && (
        <span className="text-xs text-destructive ml-2">{error}</span>
      )}
    </>
  );
}
