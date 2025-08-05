import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { readFileSync } from "node:fs";
import { z } from "zod";

// 1. Load SDL
const typeDefs = readFileSync("./src/schema.graphql", "utf8");

// 2. Dummy data
const jobs = [{ id: "1", title: "TS Dev", company: "Acme", fitScore: 100 }];

// 3. Resolvers
const resolvers = {
  Query: {
    jobs: (_: any, args: any) => {
      const schema = z.object({
        minFit: z.number().optional(),
        search: z.string().optional(),
        first: z.number().optional(),
      });
      const { minFit = 0, first = 50 } = schema.parse(args);
      return jobs.filter((j) => j.fitScore >= minFit).slice(0, first);
    },
  },
};

// 4. Server
async function boot() {
  const server = new ApolloServer({ typeDefs, resolvers });
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  console.log(`🚀 GraphQL running at ${url}`);
}
boot();