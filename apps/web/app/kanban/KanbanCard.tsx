import type { AnimateLayoutChanges } from "@dnd-kit/sortable";
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import type { JSX } from "react";
import React from "react";

import type { PipelineItem } from "@/types/gql";

export function KanbanCard({
  item,
  isOverlay = false,
}: {
  item: PipelineItem;
  isOverlay?: boolean;
}): JSX.Element {
  // Custom animateLayoutChanges for smoother transitions
  const animateLayoutChanges: AnimateLayoutChanges = (args) => {
    if (args.isSorting || args.wasDragging) {
      return true;
    }
    return defaultAnimateLayoutChanges(args);
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.job.id,
    animateLayoutChanges,
  });

  if (isOverlay) {
    // Render a static card for DragOverlay (no drag handles, no listeners)
    return (
      <Card
        className="border-blue-400 dark:border-blue-500 shadow-lg"
        style={{ opacity: 0.95, zIndex: 100, pointerEvents: "none" }}
      >
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-2">
            <a
              href={item.job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              tabIndex={-1}
              onClick={(e) => e.preventDefault()}
            >
              {item.job.title}
            </a>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {item.job.company}
          </p>
        </CardContent>
      </Card>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-2">
          <a
            href={item.job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {item.job.title}
          </a>
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{item.job.company}</p>
      </CardContent>
    </Card>
  );
}
