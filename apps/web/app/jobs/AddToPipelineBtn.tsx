"use client";

import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { JSX } from "react";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { usePipelineUpsertMutation } from "@/lib/hooks";

export function AddToPipelineButton({
  jobId,
  inPipeline = false,
  size = "sm",
  variant = "ghost",
}: {
  jobId: string;
  inPipeline?: boolean;
  size?: "sm" | "lg";
  variant?: "ghost" | "cta";
}): JSX.Element {
  const mutation = usePipelineUpsertMutation();
  const [optimisticInPipeline, setOptimisticInPipeline] = useState(inPipeline);
  const [clicked, setClicked] = useState(false);

  // Sync with prop changes (when parent data updates)
  // (If you want to support live updates from parent, uncomment below)
  // useEffect(() => { setOptimisticInPipeline(inPipeline); }, [inPipeline]);

  const handleClick = async (): Promise<void> => {
    // Only allow adding if not already in pipeline
    if (optimisticInPipeline) return;
    setClicked(true);
    setOptimisticInPipeline(true); // Optimistic update
    try {
      await mutation.mutateAsync({
        jobId,
        column: "wishlist",
        position: 10_000,
      });
      toast.success("Added to Pipeline → Wishlist");
    } catch {
      toast.error("Couldn’t add to Pipeline");
      setOptimisticInPipeline(false); // revert
    } finally {
      setClicked(false);
    }
  };

  return (
    <Button
      variant={variant === "cta" ? "default" : "ghost"}
      size={size}
      disabled={mutation.isPending || clicked || optimisticInPipeline}
      aria-label={optimisticInPipeline ? "In Pipeline (Wishlist)" : "Add to Pipeline (Wishlist)"}
      title={optimisticInPipeline ? "Already in Pipeline (Wishlist)" : "Add to Pipeline (Wishlist)"}
      className={`ml-2 cursor-pointer rounded-full shadow-sm transition-colors duration-150
        ${size === "lg" ? "p-3" : "p-2"}
        ${variant === "cta" ? "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 focus:ring-2 focus:ring-blue-400" : ""}
        ${optimisticInPipeline && variant === "cta" ? "bg-blue-200 text-blue-800" : ""}
        ${optimisticInPipeline ? "text-blue-500 dark:text-blue-300" : "text-gray-400 hover:text-blue-600 dark:hover:text-blue-300"}
        ${mutation.isPending || clicked ? "opacity-60" : ""} focus:outline-none`}
      onClick={handleClick}
    >
      {optimisticInPipeline ? (
        <CheckIcon
          className={
            size === "lg"
              ? "h-6 w-6 text-blue-500 dark:text-blue-300"
              : "h-5 w-5 text-blue-500 dark:text-blue-300"
          }
        />
      ) : (
        <PlusIcon
          className={
            size === "lg"
              ? "h-6 w-6 text-gray-400 hover:text-blue-500"
              : "h-5 w-5 text-gray-400 hover:text-blue-500"
          }
        />
      )}
    </Button>
  );
}
