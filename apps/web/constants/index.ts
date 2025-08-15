export const GRAPHQL_HTTP_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_HTTP_ENDPOINT ||
  "http://localhost:4000/graphql";
export const GRAPHQL_WS_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || "ws://localhost:4000/graphql";

export * as gqlQueries from "./gqlQueries";
