import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import type { JSX, ReactNode } from "react";

import { Button } from "@/components/ui/button";

export default function JobsLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <>
      <SignedOut>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Welcome to Remote Job Radar</h1>
          <p className="mb-6 text-muted-foreground">
            Sign in to view personalized job recommendations
          </p>
          <SignInButton mode="modal">
            <Button>Sign In to View Jobs</Button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <div>{children}</div>
      </SignedIn>
    </>
  );
}
