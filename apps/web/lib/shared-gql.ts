// Shared GraphQL utilities and types
import { GraphQLClient } from "graphql-request";

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  fitScore: number;
  url: string;
  publishedAt: string;
  bookmarked: boolean;
  source: string;
}

export interface JobsConnection {
  edges: Job[];
  endCursor?: string;
  hasNextPage: boolean;
}

export interface FetchJobsParams {
  minFit?: number;
  first?: number;
  search?: string;
  minSalary?: number;
  location?: string;
  sources?: string[];
  sortBy?: string;
  after?: string;
}

// GraphQL query strings
export const JOBS_QUERY = `#graphql
  query($minFit: Float, $first: Int, $search: String, $minSalary: Int, $location: String, $sources: [JobSource!], $sortBy: String, $after: String) {
    jobs(minFit: $minFit, first: $first, search: $search, minSalary: $minSalary, location: $location, sources: $sources, sortBy: $sortBy, after: $after) {
      edges {
        id
        title
        company
        location
        salaryMin
        salaryMax
        fitScore
        url
        publishedAt
        bookmarked
        source
      }
      endCursor
      hasNextPage
    }
  }
`;

export const BOOKMARK_MUTATION = `#graphql
  mutation($id: ID!) {
    bookmark(id: $id)
  }
`;

// GraphQL endpoint configuration
// These can be overridden via environment variables for different environments
export const GRAPHQL_HTTP_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_HTTP_ENDPOINT ||
  "http://localhost:4000/graphql";
export const GRAPHQL_WS_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || "ws://localhost:4000/graphql";

// Utility function to create a GraphQL client with consistent configuration
export function createGraphQLClient(token?: string | null): GraphQLClient {
  return new GraphQLClient(GRAPHQL_HTTP_ENDPOINT, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Common function to execute GraphQL queries using GraphQLClient
export async function executeGraphQLQuery<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string | null
): Promise<T> {
  const client = createGraphQLClient(token);

  try {
    return await client.request<T>(query, variables);
  } catch (error) {
    // Enhanced error handling with GraphQLClient
    const operationType = query.trim().startsWith("mutation")
      ? "Mutation"
      : "Query";
    console.error(`GraphQL ${operationType} failed:`, {
      query,
      variables,
      error,
    });
    throw error;
  }
}

// Shared jobs fetching logic
export async function fetchJobsShared(
  params: FetchJobsParams,
  token?: string | null
): Promise<JobsConnection> {
  // Filter out undefined values to keep the query clean
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );

  const response = await executeGraphQLQuery<{ jobs: JobsConnection }>(
    JOBS_QUERY,
    cleanParams,
    token
  );
  return response.jobs;
}

// Shared bookmark toggle logic
export async function toggleBookmarkShared(
  jobId: string,
  token?: string | null
): Promise<{ bookmark: boolean }> {
  return executeGraphQLQuery<{ bookmark: boolean }>(
    BOOKMARK_MUTATION,
    { id: jobId },
    token
  );
}
