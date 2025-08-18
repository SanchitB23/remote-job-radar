// Custom 404 page for Next.js App Router

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { JSX } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFound(): JSX.Element {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16">
      <Card className="w-full max-w-md mx-auto shadow-lg border-0">
        <CardContent className="flex flex-col items-center text-center p-8">
          <span className="rounded-full bg-blue-100 p-4 mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-blue-600" aria-hidden="true" />
          </span>
          <div className="text-5xl font-bold text-blue-600 mb-2">404</div>
          <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            Sorry, the page you are looking for does not exist or has been moved.
          </p>
          <Button asChild variant="default" size="lg" className="w-full sm:w-auto">
            <Link href="/">Go Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotFound;
