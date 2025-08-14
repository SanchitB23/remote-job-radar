"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useBookmarkMutation } from "@/lib/hooks";

type Props = { id: string; bookmarked: boolean };

export function BookmarkButton({ id, bookmarked }: Props) {
  const bookmarkMutation = useBookmarkMutation();
  const [optimisticBookmarked, setOptimisticBookmarked] = useState(bookmarked);

  // Sync with prop changes (when parent data updates)
  useEffect(() => {
    setOptimisticBookmarked(bookmarked);
  }, [bookmarked]);

  async function handleToggle() {
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
    <button
      aria-pressed={optimisticBookmarked}
      aria-label={optimisticBookmarked ? "Remove bookmark" : "Add bookmark"}
      title={optimisticBookmarked ? "Remove bookmark" : "Add bookmark"}
      disabled={bookmarkMutation.isPending}
      className={`ml-2 text-lg cursor-pointer ${
        optimisticBookmarked ? "text-yellow-500" : "text-gray-400"
      } ${bookmarkMutation.isPending ? "opacity-60" : ""}`}
      onClick={handleToggle}
    >
      {optimisticBookmarked ? "★" : "☆"}
    </button>
  );
}
