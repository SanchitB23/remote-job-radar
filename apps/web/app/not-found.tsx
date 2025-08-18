// Custom 404 page for Next.js App Router
import Link from "next/link";
import type { JSX } from "react";

export default function NotFound(): JSX.Element {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16">
      <div className="text-7xl font-bold text-blue-600 mb-4">404</div>
      <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
      <p className="mb-6 text-gray-500">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
