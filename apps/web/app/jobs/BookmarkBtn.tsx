"use client";

import type { JSX } from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useBookmarkMutation } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

type Props = { id: string; bookmarked: boolean };

export function BookmarkButton({ id, bookmarked }: Props): JSX.Element {
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
      variant="ghost"
      size="sm"
      aria-pressed={optimisticBookmarked}
      aria-label={optimisticBookmarked ? "Remove bookmark" : "Add bookmark"}
      title={optimisticBookmarked ? "Remove bookmark" : "Add bookmark"}
      disabled={bookmarkMutation.isPending}
      onClick={handleToggle}
      className="ml-2 p-2 h-auto cursor-pointer"
    >
      {optimisticBookmarked ? (
        <StarIconSolid className="h-4 w-4 text-yellow-500" />
      ) : (
        <StarIcon className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
      )}
    </Button>
  );
}
