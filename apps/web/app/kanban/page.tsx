"use client";
import type { DragEndEvent } from "@dnd-kit/core";
import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Card, CardContent } from "@/components/ui/card";
import { usePipeline, usePipelineUpsertMutation } from "@/lib/hooks";
import type { PipelineItem } from "@/types/gql";

import { KANBAN_COLUMNS } from "./constants";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumnDroppable } from "./KanbanColumnDroppable";
import { KanbanLoading } from "./KanbanLoading";

export default function Kanban(): JSX.Element {
  const { data: pipelineData, isLoading, error } = usePipeline();
  const pipelineUpsertMutation = usePipelineUpsertMutation();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Group pipeline items by column and sort by position
  const items = useMemo(() => {
    if (!pipelineData) {
      return {
        wishlist: [],
        applied: [],
        interview: [],
        offer: [],
      };
    }

    const grouped: Record<string, PipelineItem[]> = {
      wishlist: [],
      applied: [],
      interview: [],
      offer: [],
    };

    for (const item of pipelineData) {
      if (item?.column && item.column in grouped) {
        grouped[item.column]?.push(item);
      }
    }

    // Sort items by position within each column
    for (const column of KANBAN_COLUMNS) {
      grouped[column]?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }

    return grouped;
  }, [pipelineData]);

  async function moveTo(jobId: string, column: string, position: number): Promise<void> {
    try {
      await pipelineUpsertMutation.mutateAsync({ jobId, column, position });
      // React Query will automatically refetch the pipeline data
    } catch (err) {
      console.error("Failed to move job:", err);
      toast.error("Failed to move job. Please try again.");
    }
  }

  if (isLoading) {
    return <KanbanLoading />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
            </div>
            <p className="mt-4 text-red-600 dark:text-red-400 font-semibold">
              Failed to load pipeline.
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={async (e: DragEndEvent) => {
        setActiveId(null);
        const jobId = e.active.id as string;
        const overId = e.over?.id as string | undefined;
        if (!overId) return;

        // Find the column and new index
        let targetColumn = "";
        let newIndex = 0;
        for (const col of KANBAN_COLUMNS) {
          const idx = items[col]?.findIndex((it) => it.job?.id === overId) ?? -1;
          if (idx !== -1) {
            targetColumn = col;
            newIndex = idx;
            break;
          }
        }
        // If dropped on empty column, append to end
        if (!targetColumn) {
          for (const col of KANBAN_COLUMNS) {
            if (overId === col) {
              targetColumn = col;
              newIndex = items[col]?.length ?? 0;
              break;
            }
          }
        }
        if (!targetColumn) return;

        // Reorder: position = newIndex + 1 (1-based)
        await moveTo(jobId, targetColumn, newIndex + 1);
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
        {KANBAN_COLUMNS.map((column) => (
          <Card key={column} className="h-[80vh] bg-muted/50 flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <h2 className="font-semibold capitalize mb-4 text-lg">{column}</h2>
              <KanbanColumnDroppable id={column}>
                <SortableContext
                  id={column}
                  items={items[column]?.map((item) => item.job.id) ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 min-h-[40px] flex-1 overflow-y-auto pr-1">
                    {items[column]?.map((item: PipelineItem) => (
                      <KanbanCard key={item.id} item={item} />
                    ))}
                    {(items[column]?.length ?? 0) === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No jobs in {column}
                      </div>
                    )}
                  </div>
                </SortableContext>
              </KanbanColumnDroppable>
            </CardContent>
          </Card>
        ))}
      </div>
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeId
          ? (() => {
              const found = Object.values(items)
                .flat()
                .find((i) => i?.job?.id === activeId);
              return found ? <KanbanCard item={found} isOverlay /> : null;
            })()
          : null}
      </DragOverlay>
    </DndContext>
  );
}
