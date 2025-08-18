import type { JSX } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FilterSidebarSkeleton(): JSX.Element {
  return (
    <Card className="w-full mb-4 lg:w-72 lg:mb-0 lg:mr-4 lg:sticky lg:top-4">
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="col-span-2 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="col-span-2 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="col-span-2 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="col-span-2 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
