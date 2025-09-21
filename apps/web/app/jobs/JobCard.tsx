import { ArrowTopRightOnSquareIcon, MapPinIcon } from "@heroicons/react/24/outline";
import type { JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/types/gql";

import { BookmarkButton } from "./BookmarkBtn";
import { CompanyLogo } from "./CompanyLogo";

interface JobCardProps {
  job: Job;
}

function formatSalary(salaryMin?: number, salaryMax?: number): string {
  if (!salaryMin && !salaryMax) return "Salary not disclosed";

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
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
  return "Salary not disclosed";
}

function formatWorkType(workType?: string): string {
  if (!workType) return "Not specified";

  const normalized = workType.toLowerCase();
  if (normalized.includes("full")) return "Full-time";
  if (normalized.includes("part")) return "Part-time";
  if (normalized.includes("contract")) return "Contract";
  if (normalized.includes("freelance")) return "Freelance";
  if (normalized.includes("intern")) return "Internship";
  if (normalized.includes("temporary")) return "Temporary";
  if (normalized.includes("remote")) return "Remote";

  return workType;
}

function formatTimeAgo(publishedAt: string): string {
  const now = new Date();
  const published = new Date(publishedAt);
  const diffInHours = Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return "Just posted";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return `${Math.floor(diffInHours / 168)}w ago`;
}

function getFitScoreColor(fitScore: number): string {
  if (fitScore >= 80) return "bg-green-100 text-green-800 border-green-200";
  if (fitScore >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (fitScore >= 40) return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-red-100 text-red-800 border-red-200";
}

export function JobCard({ job }: JobCardProps): JSX.Element {
  const handleApplyClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    window.open(job.url, "_blank", "noopener,noreferrer");
  };

  const truncateDescription = (description: string, maxLength: number = 280): string => {
    if (!description) return "No description available.";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + "...";
  };

  return (
    <Card
      className="group hover:shadow-md transition-all duration-200 hover:border-border/80 cursor-pointer"
      onClick={handleApplyClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            <CompanyLogo company={job.company} size="lg" />
          </div>

          {/* Job Details */}
          <div className="flex-1 min-w-0">
            {/* Header - Title and Actions */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <p className="text-base text-muted-foreground font-medium mt-1">{job.company}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <BookmarkButton id={job.id} bookmarked={job.bookmarked} size="sm" variant="ghost" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={handleApplyClick}
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Job Meta Information */}
            <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-muted-foreground">
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {job.location}
                </div>
              )}

              <span className="font-medium text-foreground">
                {formatSalary(job.salaryMin, job.salaryMax)}
              </span>

              {job.workType && <Badge variant="secondary">{formatWorkType(job.workType)}</Badge>}

              <span>{formatTimeAgo(job.publishedAt)}</span>

              <Badge variant="outline" className="font-medium">
                {job.source}
              </Badge>
            </div>

            {/* Job Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {truncateDescription(job.description || "")}
            </p>

            {/* Bottom Row - Fit Score and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {job.fitScore > 0 && (
                  <Badge
                    variant="outline"
                    className={`font-semibold ${getFitScoreColor(job.fitScore)}`}
                  >
                    {Math.round(job.fitScore)}% match
                  </Badge>
                )}

                {job.isTracked && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Tracked
                  </Badge>
                )}
              </div>

              <Button
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleApplyClick}
              >
                View Job
                <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
