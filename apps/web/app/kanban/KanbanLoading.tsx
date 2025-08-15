import React from "react";

import { KANBAN_COLUMNS } from "./constants";

export default function KanbanLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
      {KANBAN_COLUMNS.map((column) => (
        <div
          key={column}
          className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 min-h-[60vh]"
        >
          <h2 className="font-semibold capitalize mb-4 text-zinc-900 dark:text-zinc-100">
            {column}
          </h2>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 bg-white dark:bg-zinc-900 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
