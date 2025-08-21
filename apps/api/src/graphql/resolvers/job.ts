import type { AuthenticatedGraphQLContext, JobParent } from "@/types/resolvers";

export function getJobFieldResolvers(): Record<string, unknown> {
  return {
    bookmarked: async (parent: JobParent, _: unknown, ctx: AuthenticatedGraphQLContext) => {
      const count = await ctx.prisma.bookmark.count({
        where: { user_id: ctx.userId, job_id: parent.id },
      });
      return count > 0;
    },
    isTracked: async (parent: JobParent, _: unknown, ctx: AuthenticatedGraphQLContext) => {
      if (!ctx.userId) return false;
      const x = await ctx.prisma.pipelineItem.findUnique({
        where: {
          user_id_job_id: {
            user_id: ctx.userId,
            job_id: parent.id,
          },
        },
      });
      return x !== null;
    },
  };
}
