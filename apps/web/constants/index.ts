export const GRAPHQL_BASE_URL = process.env.NEXT_PUBLIC_GRAPHQL_BASE_URL || "http://localhost:4000";
export const GRAPHQL_WS_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || "ws://localhost:4000/graphql";

// Clerk configuration with build-time fallbacks
export const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder_for_build";

export * as gqlQueries from "./gqlQueries";
