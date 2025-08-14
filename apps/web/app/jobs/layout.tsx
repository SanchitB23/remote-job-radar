import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedOut>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">
            Welcome to Remote Job Radar
          </h1>
          <p className="mb-6">
            Sign in to view personalized job recommendations
          </p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Sign In to View Jobs
            </button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <div>
          <h1 className="text-2xl font-bold mb-6">Your Job Recommendations</h1>
          {children}
        </div>
      </SignedIn>
    </>
  );
}
