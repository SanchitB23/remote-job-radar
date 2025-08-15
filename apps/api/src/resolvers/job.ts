export function getJobFieldResolvers() {
  return {
    bookmarked: async (parent: any, _: any, ctx: any) => {
      const count = await ctx.prisma.bookmark.count({
        where: { user_id: ctx.userId, job_id: parent.id },
      });
      return count > 0;
    },
    isTracked: async (parent: any, _: any, ctx: any) => {
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
