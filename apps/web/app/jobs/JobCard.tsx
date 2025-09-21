import type { JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/types/gql";

import { AddToPipelineButton } from "./AddToPipelineBtn";
import { BookmarkButton } from "./BookmarkBtn";
import { CompanyLogo } from "./CompanyLogo";

interface JobCardProps {
  job: Job;
}

function formatSalary(salaryMin?: number, salaryMax?: number): string {
  if (!salaryMin && !salaryMax) return "";

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`;
    }
    return `$${amount.toLocaleString()}`;
  };

  if (salaryMin && salaryMax) {
    return `${formatAmount(salaryMin)} - ${formatAmount(salaryMax)}`;
  }
  if (salaryMin) {
    return `${formatAmount(salaryMin)}+`;
  }
  if (salaryMax) {
    return `Up to ${formatAmount(salaryMax)}`;
  }
  return "";
}

function formatWorkTypeAndLocation(workType?: string, location?: string): string {
  const parts = [];
  if (location) parts.push(location);
  if (workType) parts.push(workType);
  return parts.join(" | ");
}

export function JobCard({ job }: JobCardProps): JSX.Element {
  const salaryText = formatSalary(job.salaryMin, job.salaryMax);
  const locationText = formatWorkTypeAndLocation(job.workType, job.location);

  return (
    <Card
      className="group transition-all duration-200 hover:shadow-md hover:border-border/80 cursor-pointer bg-card/50 hover:bg-card/80 backdrop-blur-sm border-border/50"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-action-btn]")) return;
        window.open(job.url, "_blank", "noopener");
      }}
      tabIndex={0}
      role="button"
      aria-label={`View job: ${job.title} at ${job.company}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const target = e.target as HTMLElement;
          if (target.closest("[data-action-btn]")) return;
          window.open(job.url, "_blank", "noopener");
        }
      }}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-row items-start gap-4">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            <CompanyLogo
              company={job.company}
              size="lg"
              className="transition-transform duration-200 group-hover:scale-105"
            />
          </div>

          {/* Job Details */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title and Company */}
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                {job.title}
              </h3>
              <p className="text-muted-foreground text-sm font-medium">{job.company}</p>
            </div>

            {/* Job Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
              {salaryText && <span className="font-medium text-foreground">{salaryText}</span>}
              {locationText && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {locationText}
                </span>
              )}
              {job.source && (
                <Badge variant="outline" className="text-xs py-0 px-2 h-5 border-border/50">
                  {job.source}
                </Badge>
              )}
            </div>

            {/* Job Description */}
            {job.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {job.description}
              </p>
            )}

            {/* Fit Score and Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {job.fitScore > 0 && (
                <Badge
                  variant={
                    job.fitScore >= 80 ? "default" : job.fitScore >= 60 ? "secondary" : "outline"
                  }
                  className="text-xs font-medium flex items-center gap-1 h-6"
                >
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {Math.round(job.fitScore)}% match
                </Badge>
              )}

              {job.bookmarked && (
                <Badge
                  variant="outline"
                  className="text-xs h-6 border-amber-200 text-amber-700 bg-amber-50"
                >
                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                  Saved
                </Badge>
              )}

              {job.isTracked && (
                <Badge
                  variant="outline"
                  className="text-xs h-6 border-blue-200 text-blue-700 bg-blue-50"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 11l3 3 8-8" />
                  </svg>
                  Tracked
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="flex-shrink-0 flex flex-col sm:flex-row gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200"
            data-action-btn
          >
            <span title={job.bookmarked ? "Remove bookmark" : "Bookmark this job"}>
              <BookmarkButton
                id={job.id}
                bookmarked={job.bookmarked ?? false}
                size="sm"
                variant="ghost"
              />
            </span>
            <span title="Add to Pipeline">
              <AddToPipelineButton
                jobId={job.id}
                inPipeline={job.isTracked}
                size="sm"
                variant="ghost"
              />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
