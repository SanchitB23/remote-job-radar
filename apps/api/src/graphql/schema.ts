import { makeExecutableSchema } from "@graphql-tools/schema";
import { PrismaClient } from "@prisma/client";

import { getResolvers } from "./resolvers/index.js";
import { getTypeDefs } from "./schema/loadSchema.js";

const prisma = new PrismaClient();
const typeDefs = getTypeDefs();
const resolvers = getResolvers(prisma);

export const schema = makeExecutableSchema({ typeDefs, resolvers });
