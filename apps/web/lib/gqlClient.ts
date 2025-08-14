"use server";
import { auth } from "@clerk/nextjs/server";
import { GraphQLClient } from "graphql-request";
import { createClient } from "graphql-ws";

export async function toggleBookmark(jobId: string) {
  const { processGraphQLResponse } = await import("./dataUtils");
  const client = await getClient();
  const raw = await client.rawRequest(`mutation($id:ID!){ bookmark(id:$id) }`, {
    id: jobId,
  });
  // The .rawRequest method returns { data, errors, ... }
  // We mimic the fetch response shape for processGraphQLResponse
  return processGraphQLResponse(
    {
      ok: true,
      json: async () => raw,
    },
    { logLabel: "toggleBookmark" }
  );
}

export async function fetchJobs({
  minFit,
  first,
}: {
  minFit?: number;
  first?: number;
}) {
  const { processGraphQLResponse } = await import("./dataUtils");
  const { getToken } = await auth();
  const jwt = await getToken({ template: "remote-job-radar" });

  const res = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify({
      query: `query($minFit: Float, $first: Int){
        jobs(minFit: $minFit, first: $first){ id title company fitScore url publishedAt bookmarked }
      }`,
      variables: { minFit, first },
    }),
    cache: "no-store",
  });

  return processGraphQLResponse(res, { logLabel: "fetchJobs" });
}

export async function getClient() {
  const { getToken } = await auth();
  const jwt = await getToken({ template: "remote-job-radar" });
  return new GraphQLClient("http://localhost:4000/graphql", {
    headers: { Authorization: `Bearer ${jwt}` },
  });
}

export async function getWSClient() {
  const { getToken } = await auth();
  const jwt = await getToken({ template: "remote-job-radar" });
  return createClient({
    url: "ws://localhost:4000/graphql",
    connectionParams: { Authorization: `Bearer ${jwt}` },
  });
}
