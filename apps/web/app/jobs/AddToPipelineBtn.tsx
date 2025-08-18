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
}: {
  jobId: string;
  inPipeline?: boolean;
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
      variant="ghost"
      size="sm"
      disabled={mutation.isPending || clicked || optimisticInPipeline}
      aria-label={optimisticInPipeline ? "In Pipeline (Wishlist)" : "Add to Pipeline (Wishlist)"}
      title={optimisticInPipeline ? "Already in Pipeline (Wishlist)" : "Add to Pipeline (Wishlist)"}
      className={`ml-2 text-lg cursor-pointer align-middle transition-colors duration-150
        ${
          optimisticInPipeline
            ? "text-blue-500 dark:text-blue-400"
            : "text-gray-400 hover:text-blue-600 dark:hover:text-blue-300"
        }
        ${mutation.isPending || clicked ? "opacity-60" : ""} focus:outline-none`}
      onClick={handleClick}
    >
      {optimisticInPipeline ? (
        <CheckIcon className="h-4 w-4 text-blue-500" />
      ) : (
        <PlusIcon className="h-4 w-4 text-gray-400 hover:text-blue-500" />
      )}
    </Button>
  );
}
