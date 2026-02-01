import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Display name for an author: "Unknown", "Deleted user", or username. */
export function displayAuthorName(author: User | undefined): string {
  if (!author) return "Unknown";
  if (author.deletedAt) return "Deleted user";
  return author.username;
}
