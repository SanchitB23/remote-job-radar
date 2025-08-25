"use client";

import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useBookmarkMutation } from "@/lib/hooks";

type Props = { id: string; bookmarked: boolean; size?: "sm" | "lg"; variant?: "ghost" | "cta" };

export function BookmarkButton({
  id,
  bookmarked,
  size = "sm",
  variant = "ghost",
}: Props): JSX.Element {
  const bookmarkMutation = useBookmarkMutation();
  const [optimisticBookmarked, setOptimisticBookmarked] = useState(bookmarked);

  // Sync with prop changes (when parent data updates)
  useEffect(() => {
    setOptimisticBookmarked(bookmarked);
  }, [bookmarked]);

  async function handleToggle(): Promise<void> {
    const newState = !optimisticBookmarked;
    setOptimisticBookmarked(newState); // Optimistic update

    try {
      const response = await bookmarkMutation.mutateAsync(id);
      console.log("Bookmark mutation result:", response.bookmark);

      // Sync with server response (in case server state differs from optimistic)
      setOptimisticBookmarked(response.bookmark);

      toast.success(response.bookmark ? "Bookmarked" : "Removed bookmark");
    } catch (error) {
      // Revert on error
      setOptimisticBookmarked(!newState);
      console.error("Error occurred while updating bookmark:", error);
      toast.error("Couldn't update bookmark. Please try again.");
    }
  }

  return (
    <Button
      variant={variant === "cta" ? "default" : "ghost"}
      size={size}
      aria-pressed={optimisticBookmarked}
      aria-label={optimisticBookmarked ? "Remove bookmark" : "Add bookmark"}
      title={optimisticBookmarked ? "Remove bookmark" : "Add bookmark"}
      disabled={bookmarkMutation.isPending}
      onClick={handleToggle}
      className={`ml-2 h-auto cursor-pointer rounded-full shadow-sm transition-all duration-150
        ${size === "lg" ? "p-3" : "p-2"}
        ${variant === "cta" ? "bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 focus:ring-2 focus:ring-secondary/40" : ""}
        ${optimisticBookmarked && variant === "cta" ? "bg-secondary/20 text-secondary" : ""}
      `}
    >
      {optimisticBookmarked ? (
        <StarIconSolid
          className={size === "lg" ? "h-6 w-6 text-secondary" : "h-4 w-4 text-secondary"}
        />
      ) : (
        <StarIcon
          className={
            size === "lg"
              ? "h-6 w-6 text-muted-foreground hover:text-secondary"
              : "h-4 w-4 text-muted-foreground hover:text-secondary"
          }
        />
      )}
    </Button>
  );
}
