import { GraphQLError } from "graphql";

import type { AuthenticatedGraphQLContext, PipelineUpsertArgs } from "@/types/resolvers";

export const pipelineUpsert = async (
  _: unknown,
  { jobId, column, position }: PipelineUpsertArgs,
  ctx: AuthenticatedGraphQLContext,
): Promise<boolean> => {
  if (!ctx.userId) throw new GraphQLError("UNAUTHENTICATED");
  await ctx.prisma.pipelineItem.upsert({
    where: { user_id_job_id: { user_id: ctx.userId, job_id: jobId } },
    create: { user_id: ctx.userId, job_id: jobId, column, position },
    update: { column, position },
  });
  return true;
};
