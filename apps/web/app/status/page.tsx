"use client";

import { useQueries } from "@tanstack/react-query";

// List of health API endpoints in /api/health
const HEALTH_APIS = [
  { name: "GraphQL API", path: "/api/health/graphql" },
  { name: "Aggregator (Cron)", path: "/api/health/cron" },
  { name: "DB", path: "/api/health/db" },
  { name: "Embedder", path: "/api/health/embedder" },
  { name: "Web", path: "/api/health/web" },
];

type HealthApiStatus = {
  ok: boolean;
  error?: string;
  timestamp?: string;
};

async function fetchHealthApi(path: string): Promise<HealthApiStatus> {
  try {
    const res = await fetch(path);
    const data = await res.json();
    return { ...data, ok: !!data.ok };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export default function StatusPage() {
  const results = useQueries({
    queries: HEALTH_APIS.map((api) => ({
      queryKey: ["health-api", api.name],
      queryFn: () => fetchHealthApi(api.path),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">Service Status Dashboard</h1>
      <div className="space-y-4">
        {HEALTH_APIS.map((api, idx) => {
          const query = results[idx];
          return (
            <div
              key={api.name}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <div className="font-semibold">{api.name}</div>
                <div className="text-xs text-gray-500 break-all">
                  {api.path}
                </div>
                {query.data?.timestamp && (
                  <div className="text-xs text-gray-400">
                    Last checked:{" "}
                    {new Date(query.data.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
              <div>
                {query.isLoading ? (
                  <span className="text-gray-400">Checking...</span>
                ) : query.data?.ok ? (
                  <span className="text-green-600 font-bold">UP</span>
                ) : (
                  <>
                    <span className="text-red-600 font-bold">DOWN</span>
                    {query.data?.error && (
                      <div className="text-xs text-red-400">
                        {query.data.error}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
