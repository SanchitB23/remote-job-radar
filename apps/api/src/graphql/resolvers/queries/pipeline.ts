import { GraphQLError } from "graphql";

import type { AuthenticatedGraphQLContext } from "../../../types/resolvers.js";

export const pipeline = async (_: unknown, __: unknown, ctx: AuthenticatedGraphQLContext) => {
  if (!ctx.userId) {
    throw new GraphQLError("UNAUTHENTICATED", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  try {
    return await ctx.prisma.pipelineItem.findMany({
      where: { user_id: ctx.userId },
      include: { job: true },
      orderBy: [{ column: "asc" }, { position: "asc" }],
    });
  } catch (error) {
    console.error("Error in pipeline query:", error);
    throw new GraphQLError("Failed to fetch pipeline items");
  }
};
