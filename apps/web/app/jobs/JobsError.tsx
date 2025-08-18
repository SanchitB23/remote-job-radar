"use client";

import type { JSX } from "react";

export function JobsError({ error }: { error: unknown }): JSX.Element {
  return (
    <div className="text-center py-12">
      <div className="rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto flex items-center justify-center text-3xl text-red-600">
        !
      </div>
      <p className="mt-4 text-red-600 dark:text-red-400 font-semibold">Failed to load jobs.</p>
      <p className="mt-2 text-gray-500 text-sm">
        {error instanceof Error ? error.message : "An unknown error occurred."}
      </p>
    </div>
  );
}
