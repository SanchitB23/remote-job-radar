import type { JSX } from "react";

export function JobCardSkeleton(): JSX.Element {
  return (
    <li className="relative border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 rounded-lg animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
          <div className="h-3 bg-green-200 dark:bg-green-900 rounded w-1/4" />
        </div>
        <div className="ml-2">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        </div>
      </div>
    </li>
  );
}
