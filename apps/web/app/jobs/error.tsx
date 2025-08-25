"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { JSX } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  return (
    <div className="text-center py-12">
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex justify-center mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-destructive">Something went wrong</h1>
          <p className="mb-6 text-muted-foreground">
            {error.message ||
              "An unexpected error occurred while loading jobs or updating bookmarks."}
          </p>
          <Button onClick={() => reset()} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
