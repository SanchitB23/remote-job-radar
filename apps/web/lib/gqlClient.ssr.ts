// UNUSED: This entire file is not used anywhere in the codebase
// "use server";
// import { auth } from "@clerk/nextjs/server";
// import { createClient } from "graphql-ws";
// import {
//   createGraphQLClient,
//   GRAPHQL_WS_ENDPOINT,
//   toggleBookmarkShared,
// } from "./shared-gql";

// export async function getWSClient() {
//   const { getToken } = await auth();
//   const token = await getToken({ template: "remote-job-radar" });
//   return createClient({
//     url: GRAPHQL_WS_ENDPOINT,
//     connectionParams: { Authorization: `Bearer ${token}` },
//   });
// }
