"use client";

import type { JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/types/gql";

import { AddToPipelineButton } from "./AddToPipelineBtn";
import { BookmarkButton } from "./BookmarkBtn";

export function JobCard({ j }: { j: Job }): JSX.Element {
  return (
    <Card
      className="transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-alias group"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-bookmark-btn]")) return;
        window.open(j.url, "_blank", "noopener");
      }}
      tabIndex={0}
      role="button"
      aria-label={j.title}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const target = e.target as HTMLElement;
          if (target.closest("[data-bookmark-btn]")) return;
          window.open(j.url, "_blank", "noopener");
        }
      }}
    >
      <CardContent className="p-4">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <h3 className="font-semibold text-lg">{j.title}</h3>
            <p className="text-muted-foreground">{j.company}</p>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {j.description}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span title="Location" className="inline-block">
                <span className="font-medium">Location:</span>{" "}
                {j.location && j.location.trim() ? j.location : "Remote"}
              </span>
              {(typeof j.salaryMin === "number" && j.salaryMin > 0) ||
              (typeof j.salaryMax === "number" && j.salaryMax > 0) ? (
                <span title="Salary Range" className="inline-block">
                  <span className="font-medium">Salary:</span>{" "}
                  {(() => {
                    const hasMin = typeof j.salaryMin === "number" && j.salaryMin > 0;
                    const hasMax = typeof j.salaryMax === "number" && j.salaryMax > 0;

                    if (hasMin && hasMax) {
                      return `$${j.salaryMin!.toLocaleString()} - $${j.salaryMax!.toLocaleString()}`;
                    } else if (hasMin) {
                      return `Min. $${j.salaryMin!.toLocaleString()}`;
                    } else if (hasMax) {
                      return `Max. $${j.salaryMax!.toLocaleString()}`;
                    }
                    return "";
                  })()}
                </span>
              ) : null}
              {j.publishedAt && (
                <span title="Published At" className="inline-block">
                  <span className="font-medium">Published:</span>{" "}
                  {new Date(parseInt(j.publishedAt, 10)).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
            <Badge variant={j.fitScore === 0 ? "secondary" : "default"} className="mt-2">
              Fit Score: {j.fitScore === 0 ? "N/A" : `${Math.round(j.fitScore)}%`}
            </Badge>
          </div>
          <span
            className="z-20 pointer-events-auto flex flex-row gap-3 justify-center items-center w-full sm:w-auto mt-4 sm:mt-0"
            data-bookmark-btn
          >
            <span title={j.bookmarked ? "Remove bookmark" : "Bookmark this job"}>
              <BookmarkButton
                id={j.id}
                bookmarked={j.bookmarked ?? false}
                size="lg"
                variant="cta"
              />
            </span>
            <span title="Add to Pipeline (Wishlist)">
              <AddToPipelineButton jobId={j.id} inPipeline={j.isTracked} size="lg" variant="cta" />
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
