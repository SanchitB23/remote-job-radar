import { GraphQLError } from "graphql";

import type {
  AuthenticatedGraphQLContext,
  BookmarkArgs,
  PipelineReorderArgs,
  PipelineUpsertArgs,
} from "../types/resolvers.js";

export function getMutationResolvers(_prisma: unknown): any {
  return {
    bookmark: async (_: unknown, { id }: BookmarkArgs, ctx: AuthenticatedGraphQLContext) => {
      if (!ctx.userId) throw new GraphQLError("UNAUTHENTICATED");
      try {
        const where = { user_id_job_id: { user_id: ctx.userId, job_id: id } };
        const existing = await ctx.prisma.bookmark.findUnique({ where });
        if (existing) {
          await ctx.prisma.bookmark.delete({ where });
          return false; // now unbookmarked
        }
        await ctx.prisma.bookmark.create({
          data: { user_id: ctx.userId, job_id: id },
        });
        return true; // now bookmarked
      } catch (error) {
        console.error("Error occurred while bookmarking:", error);
        throw new GraphQLError("Failed to bookmark job");
      }
    },
    pipelineUpsert: async (
      _: unknown,
      { jobId, column, position }: PipelineUpsertArgs,
      ctx: AuthenticatedGraphQLContext,
    ) => {
      if (!ctx.userId) throw new GraphQLError("UNAUTHENTICATED");
      await ctx.prisma.pipelineItem.upsert({
        where: { user_id_job_id: { user_id: ctx.userId, job_id: jobId } },
        create: { user_id: ctx.userId, job_id: jobId, column, position },
        update: { column, position },
      });
      return true;
    },
    pipelineReorder: async (
      _: unknown,
      { ids, positions }: PipelineReorderArgs,
      ctx: AuthenticatedGraphQLContext,
    ) => {
      if (!ctx.userId) throw new GraphQLError("UNAUTHENTICATED");
      await ctx.prisma.$transaction(
        ids.map((id: string, i: number) => {
          const position = positions[i];
          if (position === undefined) {
            throw new Error(`Position at index ${i} is undefined`);
          }
          return ctx.prisma.pipelineItem.update({
            where: { id },
            data: { position },
          });
        }),
      );
      return true;
    },
  };
}
