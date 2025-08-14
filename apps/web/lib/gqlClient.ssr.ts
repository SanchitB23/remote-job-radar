"use server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "graphql-ws";
import {
  fetchJobsShared,
  toggleBookmarkShared,
  createGraphQLClient,
  type FetchJobsParams,
  GRAPHQL_WS_ENDPOINT,
} from "./shared-gql";

export async function toggleBookmark(jobId: string) {
  const { getToken } = await auth();
  const jwt = await getToken({ template: "remote-job-radar" });

  return toggleBookmarkShared(jobId, jwt);
}

export async function fetchJobs(params: FetchJobsParams) {
  const { getToken } = await auth();
  const jwt = await getToken({ template: "remote-job-radar" });

  return fetchJobsShared(params, jwt);
}

export async function getClient() {
  const { getToken } = await auth();
  const jwt = await getToken({ template: "remote-job-radar" });
  return createGraphQLClient(jwt);
}

export async function getWSClient() {
  const { getToken } = await auth();
  const jwt = await getToken({ template: "remote-job-radar" });
  return createClient({
    url: GRAPHQL_WS_ENDPOINT,
    connectionParams: { Authorization: `Bearer ${jwt}` },
  });
}
