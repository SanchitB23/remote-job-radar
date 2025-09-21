import { ArrowTopRightOnSquareIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "motion/react";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/types/gql";

import { BookmarkButton } from "./BookmarkBtn";
import { CompanyLogo } from "./CompanyLogo";

interface JobCardProps {
  job: Job;
  isExpanded?: boolean;
  onExpand?: (job: Job) => void;
  onCollapse?: () => void;
}

function formatSalary(salaryMin?: number, salaryMax?: number): string {
  if (!salaryMin && !salaryMax) return "Salary not disclosed";

  const formatAmount = (amount: number): string => {
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

export function JobCard({ job, isExpanded, onExpand, onCollapse }: JobCardProps): JSX.Element {
  const [localExpanded, setLocalExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Use local state if not controlled by parent
  const expanded = isExpanded !== undefined ? isExpanded : localExpanded;

  const handleExpand = useCallback(
    (value: boolean) => {
      if (isExpanded !== undefined) {
        value ? onExpand?.(job) : onCollapse?.();
      } else {
        setLocalExpanded(value);
      }
    },
    [isExpanded, onExpand, onCollapse, job],
  );

  useOnClickOutside(ref as React.RefObject<HTMLElement>, () => {
    if (expanded) {
      handleExpand(false);
    }
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && expanded) {
        handleExpand(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded, handleExpand]);

  const handleApplyClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    window.open(job.url, "_blank", "noopener,noreferrer");
  };

  const handleCardClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (!expanded) {
      handleExpand(true);
    }
  };

  const truncateDescription = (description: string, maxLength: number = 280): string => {
    if (!description) return "No description available.";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + "...";
  };

  return (
    <>
      {/* Modal Backdrop */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            style={{ pointerEvents: expanded ? "auto" : "none" }}
          />
        )}
      </AnimatePresence>

      {/* Modal Content */}
      <AnimatePresence>
        {expanded && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              ref={ref}
              layoutId={`job-card-${job.id}`}
              className="bg-background w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border shadow-lg"
              style={{ borderRadius: 12 }}
            >
              <CardContent className="p-6">
                {/* Close Button */}
                <div className="flex justify-end mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleExpand(false)}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Expanded Content */}
                <div className="flex items-start gap-6">
                  <motion.div layoutId={`job-logo-${job.id}`} className="flex-shrink-0">
                    <CompanyLogo company={job.company} size="lg" />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <motion.h2
                          layoutId={`job-title-${job.id}`}
                          className="text-2xl font-bold text-foreground mb-2"
                        >
                          {job.title}
                        </motion.h2>
                        <motion.p
                          layoutId={`job-company-${job.id}`}
                          className="text-xl text-muted-foreground font-medium"
                        >
                          {job.company}
                        </motion.p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <BookmarkButton id={job.id} bookmarked={job.bookmarked} size="lg" />
                        <Button onClick={handleApplyClick} className="min-w-[100px]">
                          Apply Now
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>

                    {/* Meta Information */}
                    <motion.div
                      layoutId={`job-meta-${job.id}`}
                      className="flex flex-wrap items-center gap-4 mb-6 text-base"
                    >
                      {job.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPinIcon className="h-5 w-5" />
                          {job.location}
                        </div>
                      )}

                      <span className="font-semibold text-foreground text-lg">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </span>

                      {job.workType && (
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          {formatWorkType(job.workType)}
                        </Badge>
                      )}

                      <span className="text-muted-foreground">
                        {formatTimeAgo(job.publishedAt)}
                      </span>

                      <Badge variant="outline" className="font-medium">
                        {job.source}
                      </Badge>
                    </motion.div>

                    {/* Full Description */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="prose prose-sm max-w-none mb-6"
                    >
                      <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                      <div
                        className="text-muted-foreground leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: job.description || "No description available.",
                        }}
                      />
                    </motion.div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-3">
                        {job.fitScore > 0 && (
                          <Badge
                            variant="outline"
                            className={`font-semibold text-base px-3 py-1 ${getFitScoreColor(job.fitScore)}`}
                          >
                            {Math.round(job.fitScore)}% match
                          </Badge>
                        )}

                        {job.isTracked && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            Tracked
                          </Badge>
                        )}
                      </div>

                      <Button onClick={handleApplyClick} size="lg">
                        Apply Now
                        <ArrowTopRightOnSquareIcon className="h-5 w-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collapsed Card */}
      <motion.div layoutId={`job-card-${job.id}`}>
        <Card
          className={`group hover:shadow-md transition-all duration-200 hover:border-border/80 cursor-pointer ${
            expanded ? "opacity-0 pointer-events-none" : ""
          }`}
          onClick={handleCardClick}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Company Logo */}
              <motion.div layoutId={`job-logo-${job.id}`} className="flex-shrink-0">
                <CompanyLogo company={job.company} size="lg" />
              </motion.div>

              {/* Job Details */}
              <div className="flex-1 min-w-0">
                {/* Header - Title and Actions */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <motion.h3
                      layoutId={`job-title-${job.id}`}
                      className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors"
                    >
                      {job.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`job-company-${job.id}`}
                      className="text-base text-muted-foreground font-medium mt-1"
                    >
                      {job.company}
                    </motion.p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <BookmarkButton
                      id={job.id}
                      bookmarked={job.bookmarked}
                      size="sm"
                      variant="ghost"
                    />
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
                <motion.div
                  layoutId={`job-meta-${job.id}`}
                  className="flex flex-wrap items-center gap-3 mb-3 text-sm text-muted-foreground"
                >
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {job.location}
                    </div>
                  )}

                  <span className="font-medium text-foreground">
                    {formatSalary(job.salaryMin, job.salaryMax)}
                  </span>

                  {job.workType && (
                    <Badge variant="secondary">{formatWorkType(job.workType)}</Badge>
                  )}

                  <span>{formatTimeAgo(job.publishedAt)}</span>

                  <Badge variant="outline" className="font-medium">
                    {job.source}
                  </Badge>
                </motion.div>

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
                    onClick={handleCardClick}
                  >
                    View Details
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
