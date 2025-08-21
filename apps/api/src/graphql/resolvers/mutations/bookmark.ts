import { GraphQLError } from "graphql";

import type { AuthenticatedGraphQLContext, BookmarkArgs } from "../../../types/resolvers.js";

export const bookmark = async (
  _: unknown,
  { id }: BookmarkArgs,
  ctx: AuthenticatedGraphQLContext,
) => {
  if (!ctx.userId) throw new GraphQLError("UNAUTHENTICATED");
  try {
    const where = { user_id_job_id: { user_id: ctx.userId, job_id: id } };
    const existing = await ctx.prisma.bookmark.findUnique({ where });
    if (existing) {
      await ctx.prisma.bookmark.delete({ where });
      return false;
    }
    await ctx.prisma.bookmark.create({
      data: { user_id: ctx.userId, job_id: id },
    });
    return true;
  } catch (error) {
    console.error("Error occurred while bookmarking:", error);
    throw new GraphQLError("Failed to bookmark job");
  }
};
