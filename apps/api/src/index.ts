import { readFileSync } from "node:fs";
import http from "node:http";
import { WebSocketServer } from "ws";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { getResolvers } from "./resolvers/index.js";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { getUserId, getUserIdFromToken } from "./auth.js";
import { useServer } from "graphql-ws/use/ws";

const prisma = new PrismaClient();

// 1. SDL & resolvers
const typeDefs = readFileSync("./src/schema.graphql", "utf8");
const resolvers = getResolvers(prisma);
const schema = makeExecutableSchema({ typeDefs, resolvers });

// 2. Create HTTP + WS servers
const app = express();
const httpServer = http.createServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });

interface WebSocketContext {
  connectionParams?: {
    Authorization?: string;
    authorization?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

useServer(
  {
    schema,
    context: async (ctx: WebSocketContext) => {
      // Restore JWT auth for WebSocket context
      const connectionParams = ctx.connectionParams || {};
      const authHeader = connectionParams.Authorization || connectionParams.authorization;
      let userId = null;
      if (authHeader) {
        userId = await getUserIdFromToken(authHeader as string);
        console.log(`[WS] WebSocket connection established. userId: ${userId ?? 'anonymous'}`);
      } else {
        console.log("[WS] WebSocket connection established. No auth header.");
      }
      return { prisma, userId };
    },
  },
  wsServer
);

// 3. Set up Express middleware
app.use(cors());
app.use(express.json());

// 4. Apollo
const apolloServer = new ApolloServer({ typeDefs, resolvers });
await apolloServer.start();
app.use(
  "/graphql",
  expressMiddleware(apolloServer, {
    context: async ({ req }) => {
      try {
        const userId = await getUserId(req);
        return { prisma, userId };
      } catch (error) {
        console.error("Context creation failed:", error);
        // Return context without userId if JWT verification fails
        return { prisma, userId: null };
      }
    },
  })
);

const PORT = 4000;
httpServer.listen(PORT, () =>
  console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`)
);
