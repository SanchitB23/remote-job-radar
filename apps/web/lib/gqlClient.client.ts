"use client";

import { createClient } from "graphql-ws";
import { GraphQLClient } from "graphql-request";

// Client-side API functions for React Query
export interface Job {
  id: string;
  title: string;
  company: string;
  fitScore: number;
  url: string;
  publishedAt: string;
  bookmarked: boolean;
}

export interface FetchJobsParams {
  minFit?: number;
  first?: number;
  search?: string;
  minSalary?: number;
  location?: string;
}

// Create GraphQL client (we'll need to handle auth on client side)
function createGraphQLClient(token?: string) {
  return new GraphQLClient("http://localhost:4000/graphql", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Client-side fetch jobs function
export async function fetchJobsClient(
  params: FetchJobsParams,
  token?: string
): Promise<{ jobs: Job[] }> {
  const client = createGraphQLClient(token);

  const query = `#graphql
    query($minFit: Float, $first: Int, $search: String, $minSalary: Int, $location: String) {
      jobs(minFit: $minFit, first: $first, search: $search, minSalary: $minSalary, location: $location) {
        id
        title
        company
        fitScore
        url
        publishedAt
        bookmarked
      }
    }
  `;

  const data = await client.request<{ jobs: Job[] }>(query, params);
  return data;
}

// Client-side bookmark toggle function
export async function toggleBookmarkClient(
  jobId: string,
  token?: string
): Promise<{ bookmark: boolean }> {
  const client = createGraphQLClient(token);

  const mutation = `#graphql
    mutation($id: ID!) {
      bookmark(id: $id)
    }
  `;

  const data = await client.request<{ bookmark: boolean }>(mutation, {
    id: jobId,
  });
  return data;
}

export async function getWSClient(jwt?: string) {
  return createClient({
    url: "ws://localhost:4000/graphql",
    connectionParams: jwt ? { Authorization: `Bearer ${jwt}` } : {},
  });
}
