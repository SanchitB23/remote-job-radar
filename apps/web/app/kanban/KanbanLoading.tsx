import type { JSX } from "react";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { KANBAN_COLUMNS } from "./constants";

export function KanbanLoading(): JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
      {KANBAN_COLUMNS.map((column) => (
        <Card key={column} className="min-h-[60vh] bg-muted/50">
          <CardContent className="p-4">
            <h2 className="font-semibold capitalize mb-4 text-lg">{column}</h2>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <Skeleton className="h-4 mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
