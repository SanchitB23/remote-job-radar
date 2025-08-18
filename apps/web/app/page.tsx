import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import type { JSX } from "react";

export default function Home(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Remote Job Radar
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover remote job opportunities that match your skills with AI-powered recommendations.
        </p>

        <SignedOut>
          <div className="space-y-4">
            <SignInButton mode="modal">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </SignInButton>
            <p className="text-sm text-gray-500">
              Sign in to access personalized job recommendations
            </p>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="space-y-4">
            <Link
              href="/jobs"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View Your Job Recommendations
            </Link>
            <p className="text-sm text-gray-500">Ready to find your next remote opportunity?</p>
          </div>
        </SignedIn>

        <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">AI-Powered Matching</h3>
            <p className="text-gray-600">
              Our intelligent algorithm analyzes job requirements against your skills to find the
              best matches.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Remote-First</h3>
            <p className="text-gray-600">
              Focus exclusively on remote and distributed work opportunities from companies
              worldwide.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Real-Time Updates</h3>
            <p className="text-gray-600">
              Get fresh job postings and opportunities as they become available across multiple
              platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
