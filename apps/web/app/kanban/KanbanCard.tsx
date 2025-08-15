import {
  useSortable,
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PipelineItem } from "@/lib/shared-gql";
import React from "react";

export function KanbanCard({
  item,
  isOverlay = false,
}: {
  item: PipelineItem;
  isOverlay?: boolean;
}) {
  // Custom animateLayoutChanges for smoother transitions
  const animateLayoutChanges: AnimateLayoutChanges = (args) => {
    if (args.isSorting || args.wasDragging) {
      return true;
    }
    return defaultAnimateLayoutChanges(args);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.job.id,
    animateLayoutChanges,
  });

  if (isOverlay) {
    // Render a static card for DragOverlay (no drag handles, no listeners)
    return (
      <div
        className="border border-blue-400 dark:border-blue-500 rounded-lg p-3 bg-white dark:bg-zinc-900 shadow-lg"
        style={{ opacity: 0.95, zIndex: 100, pointerEvents: "none" }}
      >
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm line-clamp-2">
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
        <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
          {item.job.company}
        </p>
      </div>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm line-clamp-2">
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
      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
        {item.job.company}
      </p>
    </div>
  );
}
