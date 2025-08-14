import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

interface Job {
  id: string;
  title: string;
  company: string;
  fitScore: number;
  url: string;
}

export default async function JobsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Welcome to Remote Job Radar</h1>
        <p className="mb-6">Sign in to view personalized job recommendations</p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Sign In to View Jobs
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    );
  }

  const query = `
    query($minFit: Float) {
      jobs(minFit: $minFit, first: 100) {
        id title company fitScore url
      }
    }`;
  
  try {
    const data = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { minFit: 70 } }),
      cache: "no-store",
    }).then((r) => r.json());

    return (
      <SignedIn>
        <div>
          <h1 className="text-2xl font-bold mb-6">Your Job Recommendations</h1>
          <ul className="space-y-2">
            {data.data.jobs.map((j: Job) => (
              <li key={j.id} className="border p-4 rounded-lg hover:bg-gray-50">
                <a href={j.url} target="_blank" className="block">
                  <h3 className="font-semibold text-lg">{j.title}</h3>
                  <p className="text-gray-600">{j.company}</p>
                  <p className="text-sm text-green-600">Fit Score: {Math.round(j.fitScore)}%</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </SignedIn>
    );
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return (
      <SignedIn>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Unable to load jobs</h1>
          <p className="text-gray-600">Please make sure the API server is running.</p>
        </div>
      </SignedIn>
    );
  }
}