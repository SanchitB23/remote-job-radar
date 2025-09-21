import type { JSX } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function JobCardSkeleton(): JSX.Element {
  return (
    <li>
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-row items-start gap-4">
            {/* Company Logo Skeleton */}
            <div className="flex-shrink-0">
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>

            {/* Job Details Skeleton */}
            <div className="flex-1 space-y-2">
              {/* Title and Company */}
              <div className="space-y-1">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>

              {/* Job Meta Info */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Tags */}
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex-shrink-0 flex flex-col gap-2">
              <Skeleton className="w-8 h-8 rounded-md" />
              <Skeleton className="w-8 h-8 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
