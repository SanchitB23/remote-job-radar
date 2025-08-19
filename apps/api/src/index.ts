import { readFileSync } from "node:fs";
import http from "node:http";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import { useServer } from "graphql-ws/use/ws";
import { WebSocketServer } from "ws";

import { getUserId, getUserIdFromToken } from "./auth.js";
import { getResolvers } from "./resolvers/index.js";

const prisma = new PrismaClient();

// 1. SDL & resolvers
const typeDefs = readFileSync("./src/schema.graphql", "utf8");
const resolvers = getResolvers(prisma);
const schema = makeExecutableSchema({ typeDefs, resolvers });

// 2. Create HTTP + WS servers
const app = express();
const httpServer = http.createServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });

// Health check endpoint (must be after app is defined)
app.get("/health", (req, res) => {
  // API health check: return boolean and status code
  res.status(200).json({ ok: true });
});

// DB health check endpoint
app.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ db: "ok" });
  } catch (err) {
    console.error("DB health check failed:", err);
    res.status(503).json({ db: "unhealthy" });
  }
});

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
        console.log(`[WS] WebSocket connection established. userId: ${userId ?? "anonymous"}`);
      } else {
        console.log("[WS] WebSocket connection established. No auth header.");
      }
      return { prisma, userId };
    },
  },
  wsServer,
);

// 3. Set up Express middleware
// Parse allowed origins from environment variable (comma-separated)
const allowedOrigins = process.env.GQL_API_CORS_ORIGIN
  ? process.env.GQL_API_CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : undefined;

if (!allowedOrigins || allowedOrigins.length === 0) {
  throw new Error("CORS_ORIGIN environment variable must be set with at least one allowed origin.");
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
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
  }),
);

const PORT = process.env.GQL_API_PORT || 4000;
const DEPLOYED_URL = process.env.GQL_API_BASE_URL || `http://localhost:${PORT}`;
httpServer.listen(PORT, () => console.log(`🚀 GraphQL ready at ${DEPLOYED_URL}/graphql`));
