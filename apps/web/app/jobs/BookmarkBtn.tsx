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
      className={`ml-2 h-auto cursor-pointer rounded-full shadow-sm transition-colors duration-150
        ${size === "lg" ? "p-3" : "p-2"}
        ${variant === "cta" ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 focus:ring-2 focus:ring-yellow-400" : ""}
        ${optimisticBookmarked && variant === "cta" ? "bg-yellow-200 text-yellow-800" : ""}
      `}
    >
      {optimisticBookmarked ? (
        <StarIconSolid
          className={size === "lg" ? "h-6 w-6 text-yellow-500" : "h-4 w-4 text-yellow-500"}
        />
      ) : (
        <StarIcon
          className={
            size === "lg"
              ? "h-6 w-6 text-gray-400 hover:text-yellow-500"
              : "h-4 w-4 text-gray-400 hover:text-yellow-500"
          }
        />
      )}
    </Button>
  );
}
