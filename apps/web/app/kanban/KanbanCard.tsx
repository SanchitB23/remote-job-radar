import type { JSX } from "react";
import React from "react";

import { CSS } from "@dnd-kit/utilities";
import type { AnimateLayoutChanges } from "@dnd-kit/sortable";
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import {
  ArrowTopRightOnSquareIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PipelineItem } from "@/types/gql";

// Utility functions
function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return "Salary not specified";
  if (min && max) return `$${min.toLocaleString()}-$${max.toLocaleString()}`;
  if (min) return `$${min.toLocaleString()}+`;
  return `Up to $${max?.toLocaleString()}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function getFitScoreColor(score: number): string {
  if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
  if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export function KanbanCard({
  item,
  isOverlay = false,
}: {
  item: PipelineItem;
  isOverlay?: boolean;
}): JSX.Element {
  const { job } = item;

  // Custom animateLayoutChanges for smoother transitions
  const animateLayoutChanges: AnimateLayoutChanges = (args) => {
    if (args.isSorting || args.wasDragging) {
      return true;
    }
    return defaultAnimateLayoutChanges(args);
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    animateLayoutChanges,
  });

  const cardContent = (
    <CardContent className="p-4 space-y-3">
      {/* Header with title and external link */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">{job.title}</h3>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
            onClick={(e) => e.stopPropagation()}
            title="View job posting"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </a>
        </div>

        {/* Company info */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <BuildingOfficeIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-xs font-medium truncate">{job.company}</span>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Job details */}
      <div className="space-y-2">
        {/* Location and work type */}
        {(job.location || job.workType) && (
          <div className="flex items-center gap-2 flex-wrap">
            {job.location && (
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{job.location}</span>
              </div>
            )}
            {job.workType && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {job.workType}
              </Badge>
            )}
          </div>
        )}

        {/* Salary */}
        {(job.salaryMin || job.salaryMax) && (
          <div className="flex items-center gap-1">
            <CurrencyDollarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
          </div>
        )}

        {/* Published date */}
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Posted {formatDate(job.publishedAt)}
          </span>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Footer with fit score and bookmark */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <StarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <Badge
            variant="outline"
            className={`text-xs px-2 py-0.5 border ${getFitScoreColor(job.fitScore)}`}
          >
            {job.fitScore}% fit
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {job.bookmarked && (
            <StarSolidIcon className="h-4 w-4 text-yellow-500" title="Bookmarked" />
          )}
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {job.source}
          </Badge>
        </div>
      </div>
    </CardContent>
  );

  if (isOverlay) {
    return (
      <Card
        className="border-primary shadow-2xl bg-background max-w-[320px]"
        style={{ opacity: 0.95, zIndex: 100, pointerEvents: "none" }}
      >
        {cardContent}
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
      className="group shadow-sm hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing border-border hover:border-primary/30 bg-background"
    >
      {cardContent}
    </Card>
  );
}
