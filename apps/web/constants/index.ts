export const GRAPHQL_BASE_URL = process.env.GRAPHQL_BASE_URL || "http://localhost:4000";
export const GRAPHQL_WS_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || "ws://localhost:4000/graphql";

// Clerk configuration with build-time fallbacks
export const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder_for_build";

export * as gqlQueries from "./gqlQueries";

export const WEB_URL =
  process.env.VERCEL_ENV === "production"
    ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL
      ? "https://" + process.env.VERCEL_URL
      : "http://localhost:3000";
