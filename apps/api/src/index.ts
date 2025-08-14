import { readFileSync } from "node:fs";
import http from "node:http";
import { WebSocketServer } from "ws";
import { makeServer } from "graphql-ws";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { getResolvers } from "./resolvers/index.js";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { getUserId } from "./auth.js";

const prisma = new PrismaClient();

// 1. SDL & resolvers
const typeDefs = readFileSync("./src/schema.graphql", "utf8");
const resolvers = getResolvers(prisma);
const schema = makeExecutableSchema({ typeDefs, resolvers });

// 2. Create HTTP + WS servers
const app = express();
const httpServer = http.createServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });

// Set up GraphQL WebSocket server
const wsGraphQLServer = makeServer({
  schema,
  context: () => ({ prisma }),
});

wsServer.on("connection", (socket, request) => {
  // Create a new disposable for managing the connection
  const closed = wsGraphQLServer.opened(
    {
      protocol: socket.protocol,
      send: (data) =>
        new Promise((resolve, reject) => {
          socket.send(data, (err) => (err ? reject(err) : resolve()));
        }),
      close: (code, reason) => socket.close(code, reason),
      onMessage: (cb) => socket.on("message", cb),
    },
    { socket, request }
  );

  // Handle socket closure
  socket.once("close", (code, reason) => closed(code, reason.toString()));
});

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
