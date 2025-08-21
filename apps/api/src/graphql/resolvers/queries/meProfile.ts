import { GraphQLError } from "graphql";

import type { AuthenticatedGraphQLContext } from "@/types/resolvers";

export const meProfile = async (_: unknown, __: unknown, ctx: AuthenticatedGraphQLContext) => {
  if (!ctx.userId) {
    throw new GraphQLError("UNAUTHENTICATED", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  try {
    return await ctx.prisma.user_profile.findUnique({ where: { user_id: ctx.userId } });
  } catch (error) {
    console.error("Error in user profile query:", error);
    throw new GraphQLError("Failed to fetch user profile");
  }
};
