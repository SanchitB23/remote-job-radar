import type { FetchJobsParams, JobsConnection, PipelineItem } from "@/types/gql";

// Base API URL for the Next.js app
const API_BASE_URL = "/api";

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Fetch jobs using Next.js API route
export async function fetchJobsApi(params: FetchJobsParams): Promise<JobsConnection> {
  const queryParams = new URLSearchParams();

  // Add parameters to query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        queryParams.set(key, value.join(","));
      } else {
        queryParams.set(key, String(value));
      }
    }
  });

  const response = await fetch(`${API_BASE_URL}/jobs?${queryParams.toString()}`);
  return handleApiResponse<JobsConnection>(response);
}

// Toggle bookmark using Next.js API route
export async function toggleBookmarkApi(jobId: string): Promise<{ bookmark: boolean }> {
  const response = await fetch(`${API_BASE_URL}/bookmarks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobId }),
  });
  return handleApiResponse<{ bookmark: boolean }>(response);
}

// Fetch pipeline using Next.js API route
export async function fetchPipelineApi(): Promise<PipelineItem[]> {
  const response = await fetch(`${API_BASE_URL}/pipeline`);
  return handleApiResponse<PipelineItem[]>(response);
}

// Upsert pipeline item using Next.js API route
export async function upsertPipelineItemApi(
  jobId: string,
  column: string,
  position: number,
): Promise<{ pipelineUpsert: boolean }> {
  const response = await fetch(`${API_BASE_URL}/pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobId, column, position }),
  });
  return handleApiResponse<{ pipelineUpsert: boolean }>(response);
}
