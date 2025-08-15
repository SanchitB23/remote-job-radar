import { GraphQLError } from "graphql";

export function getMutationResolvers(prisma: any) {
  return {
    bookmark: async (_: any, { id }: any, ctx: any) => {
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
      _: any,
      { jobId, column, position }: any,
      ctx: any
    ) => {
      if (!ctx.userId) throw new GraphQLError("UNAUTHENTICATED");
      await ctx.prisma.pipelineItem.upsert({
        where: { user_id_job_id: { user_id: ctx.userId, job_id: jobId } },
        create: { user_id: ctx.userId, job_id: jobId, column, position },
        update: { column, position },
      });
      return true;
    },
    pipelineReorder: async (_: any, { ids, positions }: any, ctx: any) => {
      if (!ctx.userId) throw new GraphQLError("UNAUTHENTICATED");
      await ctx.prisma.$transaction(
        ids.map((id: string, i: number) =>
          ctx.prisma.pipelineItem.update({
            where: { id },
            data: { position: positions[i] },
          })
        )
      );
      return true;
    },
  };
}
