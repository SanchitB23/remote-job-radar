import { useDroppable } from "@dnd-kit/core";
import type { JSX, ReactNode } from "react";

export function KanbanColumnDroppable({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={isOver ? "bg-blue-50 dark:bg-blue-900/20 transition-colors" : ""}
      style={{ minHeight: 40 }}
    >
      {children}
    </div>
  );
}
