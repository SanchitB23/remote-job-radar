// Shared GraphQL utilities and types
import { GraphQLClient } from "graphql-request";

import { GRAPHQL_BASE_URL } from "@/constants";
import {
  BOOKMARK_MUTATION,
  FILTER_METADATA_QUERY,
  JOBS_QUERY,
  PIPELINE_QUERY,
  PIPELINE_UPSERT_MUTATION,
  SET_USER_SKILLS_MUTATION,
  USER_SKILLS_QUERY,
} from "@/constants/gqlQueries";
import type {
  FetchJobsParams,
  FilterMetadata,
  JobsConnection,
  PipelineItem,
  UserProfile,
} from "@/types/gql";

// Utility function to create a GraphQL client with consistent configuration
export function createGraphQLClient(token?: string | null): GraphQLClient {
  return new GraphQLClient(`${GRAPHQL_BASE_URL}/graphql`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Common function to execute GraphQL queries using GraphQLClient
export async function executeGraphQLQuery<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string | null,
): Promise<T> {
  const client = createGraphQLClient(token);

  try {
    return await client.request<T>(query, variables);
  } catch (error) {
    // Enhanced error handling with GraphQLClient
    const operationTypeMatch = query.trim().match(/^(mutation|query|subscription)\b/i);
    const operationType = operationTypeMatch?.[1]
      ? operationTypeMatch[1][0]?.toUpperCase() + operationTypeMatch[1].slice(1).toLowerCase()
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
  token?: string | null,
): Promise<JobsConnection> {
  // Filter out undefined values to keep the query clean
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  );

  const response = await executeGraphQLQuery<{ jobs: JobsConnection }>(
    JOBS_QUERY,
    cleanParams,
    token,
  );
  return response.jobs;
}

// Shared bookmark toggle logic
export async function toggleBookmarkShared(
  jobId: string,
  token?: string | null,
): Promise<{ bookmark: boolean }> {
  return executeGraphQLQuery<{ bookmark: boolean }>(BOOKMARK_MUTATION, { id: jobId }, token);
}

// Shared pipeline fetching logic
export async function fetchPipelineShared(token?: string | null): Promise<PipelineItem[]> {
  const response = await executeGraphQLQuery<{ pipeline: PipelineItem[] }>(
    PIPELINE_QUERY,
    {},
    token,
  );
  return response.pipeline;
}

// Shared pipeline upsert logic
export async function upsertPipelineItemShared(
  jobId: string,
  column: string,
  position: number,
  token?: string | null,
): Promise<{ pipelineUpsert: boolean }> {
  return executeGraphQLQuery<{ pipelineUpsert: boolean }>(
    PIPELINE_UPSERT_MUTATION,
    { jobId, column, position },
    token,
  );
}

// Shared filter metadata fetching logic
export async function fetchFilterMetadataShared(token?: string | null): Promise<FilterMetadata> {
  const response = await executeGraphQLQuery<{
    filterMetadata: FilterMetadata;
  }>(FILTER_METADATA_QUERY, {}, token);
  return response.filterMetadata;
}

export async function fetchUserSkills(token?: string | null): Promise<Pick<UserProfile, "skills">> {
  const response = await executeGraphQLQuery<{
    meProfile: UserProfile;
  }>(USER_SKILLS_QUERY, {}, token);
  return { skills: response.meProfile.skills };
}

export async function saveUserSkills(token: string | null, skills: string[]): Promise<void> {
  await executeGraphQLQuery(SET_USER_SKILLS_MUTATION, { skills }, token);
}
