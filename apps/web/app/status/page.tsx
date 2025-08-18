"use client";

import { useQueries } from "@tanstack/react-query";
import type { JSX } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

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

export default function StatusPage(): JSX.Element {
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
          if (!query) return null;
          return (
            <Card key={api.name}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{api.name}</div>
                    <div className="text-xs text-muted-foreground break-all">
                      {api.path}
                    </div>
                    {query.data?.timestamp && (
                      <div className="text-xs text-muted-foreground">
                        Last checked:{" "}
                        {new Date(query.data.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {query.isLoading ? (
                      <Badge variant="secondary">Checking...</Badge>
                    ) : query.data?.ok ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <Badge variant="default" className="bg-green-600">
                          UP
                        </Badge>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                        <Badge variant="destructive">DOWN</Badge>
                      </>
                    )}
                  </div>
                </div>
                {query.data?.error && !query.data.ok && (
                  <div className="mt-2 text-xs text-red-500">
                    {query.data.error}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
