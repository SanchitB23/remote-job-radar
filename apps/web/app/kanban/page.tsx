"use client";
import type { JSX } from "react";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanOverlay,
  type KanbanMoveEvent,
} from "@/components/ui/kanban";
import { usePipeline, usePipelineUpsertMutation } from "@/lib/hooks";
import type { PipelineItem } from "@/types/gql";

import { KANBAN_COLUMNS, COLUMN_DISPLAY_NAMES } from "./constants";
import { KanbanCard } from "./KanbanCard";
import { KanbanLoading } from "./KanbanLoading";

export default function KanbanPage(): JSX.Element {
  const { data: pipelineData, isLoading, error } = usePipeline();
  const pipelineUpsertMutation = usePipelineUpsertMutation();

  // Group pipeline items by column and sort by position
  const columns = useMemo(() => {
    if (!pipelineData) {
      return Object.fromEntries(KANBAN_COLUMNS.map((col) => [col, []]));
    }

    // Initialize all columns
    const grouped: Record<string, PipelineItem[]> = Object.fromEntries(
      KANBAN_COLUMNS.map((col) => [col, []]),
    );

    // Group items by column
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
      toast.success(`Job moved to ${COLUMN_DISPLAY_NAMES[column]}`);
    } catch (err) {
      console.error("Failed to move job:", err);
      toast.error("Failed to move job. Please try again.");
    }
  }

  const handleKanbanMove = async (moveEvent: KanbanMoveEvent): Promise<void> => {
    const { activeContainer, overContainer, overIndex } = moveEvent;

    // Find the item being moved
    const movingItem = columns[activeContainer]?.find(
      (item) => item.job.id === moveEvent.event.active.id,
    );

    if (movingItem) {
      await moveTo(movingItem.job.id, overContainer, overIndex + 1);
    }
  };

  if (isLoading) {
    return <KanbanLoading />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-destructive" />
            </div>
            <p className="mt-4 text-destructive font-semibold">Failed to load pipeline.</p>
            <p className="mt-2 text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Kanban
      value={columns}
      onValueChange={() => {}} // We handle moves via onMove
      getItemValue={(item: PipelineItem) => item.job.id}
      onMove={handleKanbanMove}
      className="bg-gradient-to-br from-background to-muted/20"
    >
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Job Application Pipeline</h1>
            <p className="text-muted-foreground mt-1">
              Track your job applications through each stage of the process
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total Jobs:</span>
              <Badge variant="secondary" className="font-mono">
                {pipelineData?.length ?? 0}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <KanbanBoard>
        {KANBAN_COLUMNS.map((columnId) => (
          <KanbanColumn key={columnId} value={columnId}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-foreground">
                {COLUMN_DISPLAY_NAMES[columnId]}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">
                  {columns[columnId]?.length ?? 0}
                </Badge>
              </div>
            </div>

            <KanbanColumnContent value={columnId}>
              {columns[columnId]?.map((item: PipelineItem) => (
                <KanbanItem key={item.id} value={item.job.id}>
                  <KanbanCard item={item} />
                </KanbanItem>
              ))}

              {(columns[columnId]?.length ?? 0) === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <PlusIcon className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No jobs yet</p>
                  <p className="text-xs">Drag jobs here to get started</p>
                </div>
              )}
            </KanbanColumnContent>
          </KanbanColumn>
        ))}
      </KanbanBoard>

      <KanbanOverlay>
        {({ value, variant }) => {
          if (variant === "item") {
            const item = Object.values(columns)
              .flat()
              .find((i) => i?.job?.id === value);
            return item ? <KanbanCard item={item} isOverlay /> : null;
          }
          return null;
        }}
      </KanbanOverlay>
    </Kanban>
  );
}
