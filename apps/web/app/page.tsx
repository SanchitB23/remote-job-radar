import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Remote Job Radar
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover remote job opportunities that match your skills with
          AI-powered recommendations.
        </p>


        <SignedOut>
          <div className="space-y-4">
            <SignInButton mode="modal">
              <Button size="lg" className="text-lg">
                Get Started
              </Button>
            </SignInButton>
            <p className="text-sm text-muted-foreground">
              Sign in to access personalized job recommendations
            </p>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="space-y-4">
            <Button asChild size="lg" className="text-lg">
              <Link href="/jobs">View Your Job Recommendations</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Ready to find your next remote opportunity?
            </p>
          </div>
        </SignedIn>

        <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">
                AI-Powered Matching
              </h3>
              <p className="text-muted-foreground">
                Our intelligent algorithm analyzes job requirements against your
                skills to find the best matches.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Remote-First</h3>
              <p className="text-muted-foreground">
                Focus exclusively on remote and distributed work opportunities
                from companies worldwide.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Real-Time Updates</h3>
              <p className="text-muted-foreground">
                Get fresh job postings and opportunities as they become
                available across multiple platforms.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
