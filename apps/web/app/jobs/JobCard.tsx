import type { JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/types/gql";

import { AddToPipelineButton } from "./AddToPipelineBtn";
import { BookmarkButton } from "./BookmarkBtn";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps): JSX.Element {
  return (
    <Card
      className="transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-alias group"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-bookmark-btn]")) return;
        window.open(job.url, "_blank", "noopener");
      }}
      tabIndex={0}
      role="button"
      aria-label={job.title}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const target = e.target as HTMLElement;
          if (target.closest("[data-bookmark-btn]")) return;
          window.open(job.url, "_blank", "noopener");
        }
      }}
    >
      <CardContent className="p-4">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <h3 className="font-semibold text-lg">{job.title}</h3>
            <p className="text-muted-foreground">{job.company}</p>
            <Badge variant={job.fitScore === 0 ? "secondary" : "default"} className="mt-2">
              Fit Score: {job.fitScore === 0 ? "N/A" : `${Math.round(job.fitScore)}%`}
            </Badge>
          </div>
          <span
            className="z-20 pointer-events-auto flex flex-row gap-3 justify-center items-center w-full sm:w-auto mt-4 sm:mt-0"
            data-bookmark-btn
          >
            <span title={job.bookmarked ? "Remove bookmark" : "Bookmark this job"}>
              <BookmarkButton
                id={job.id}
                bookmarked={job.bookmarked ?? false}
                size="lg"
                variant="cta"
              />
            </span>
            <span title="Add to Pipeline (Wishlist)">
              <AddToPipelineButton
                jobId={job.id}
                inPipeline={job.isTracked}
                size="lg"
                variant="cta"
              />
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
