"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold mb-4 text-red-600">
        Something went wrong
      </h1>
      <p className="mb-4 text-gray-700">
        {error.message ||
          "An unexpected error occurred while loading jobs or updating bookmarks."}
      </p>
      <button
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => reset()}
      >
        Try Again
      </button>
    </div>
  );
}
