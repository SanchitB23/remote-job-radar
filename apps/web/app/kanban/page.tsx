"use client";

import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumnDroppable } from "./KanbanColumnDroppable";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import KanbanLoading from "./KanbanLoading";
import { KANBAN_COLUMNS } from "./constants";
import { PipelineItem } from "@/lib/shared-gql";
import { usePipeline, usePipelineUpsertMutation } from "@/lib/hooks";

export default function Kanban() {
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
      if (grouped[item.column]) {
        grouped[item.column].push(item);
      }
    }

    // Sort items by position within each column
    for (const column of KANBAN_COLUMNS) {
      grouped[column].sort((a, b) => a.position - b.position);
    }

    return grouped;
  }, [pipelineData]);

  async function moveTo(jobId: string, column: string, position: number) {
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
        <div className="rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto flex items-center justify-center text-3xl text-red-600">
          !
        </div>
        <p className="mt-4 text-red-600 dark:text-red-400 font-semibold">
          Failed to load pipeline.
        </p>
        <p className="mt-2 text-gray-500 text-sm">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
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
          const idx = items[col].findIndex((it) => it.job.id === overId);
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
              newIndex = items[col].length;
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
          <div
            key={column}
            className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 h-[80vh] bg-gray-50 dark:bg-zinc-800/50 flex flex-col"
          >
            <h2 className="font-semibold capitalize mb-4 text-zinc-900 dark:text-zinc-100 text-lg">
              {column}
            </h2>
            <KanbanColumnDroppable id={column}>
              <SortableContext
                id={column}
                items={items[column].map((item) => item.job.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 min-h-[40px] flex-1 overflow-y-auto pr-1">
                  {items[column].map((item: PipelineItem) => (
                    <KanbanCard key={item.id} item={item} />
                  ))}
                  {items[column].length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                      No jobs in {column}
                    </div>
                  )}
                </div>
              </SortableContext>
            </KanbanColumnDroppable>
          </div>
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
                .find((i) => i.job.id === activeId);
              return found ? <KanbanCard item={found} isOverlay /> : null;
            })()
          : null}
      </DragOverlay>
    </DndContext>
  );
}
