// This file is for generic data processing, serialization, and helpers.
// Add utility functions here as needed for your app.

// Common function to process and serialize GraphQL responses and errors
export async function processGraphQLResponse(
  res: Response | { ok: boolean; json: () => Promise<any> },
  context?: { logLabel?: string }
) {
  const label = context?.logLabel || "GraphQL request failed";
  if (!res.ok) {
    // Try to extract more info if possible
    let errorDetail = "";
    if (typeof (res as Response).status !== "undefined") {
      errorDetail = ` status: ${(res as Response).status}`;
    }
    console.error(label, { error: errorDetail });
    throw new Error(`HTTP error!${errorDetail}`);
  }
  const json = await res.json();

  // Handle GraphQL errors
  if (json.errors && json.errors.length > 0) {
    const errorMessages = json.errors
      .map((error: { message: string }) => error.message)
      .join(", ");
    console.error(label, { error: errorMessages });
    throw new Error(`GraphQL errors: ${errorMessages}`);
  }

  // Handle case where data is null/undefined
  if (!json.data) {
    console.error(label, { error: "No data returned from GraphQL query" });
    throw new Error("No data returned from GraphQL query");
  }

  return json.data;
}
