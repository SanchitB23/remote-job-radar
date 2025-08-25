import { GraphQLError } from "graphql";

import type { AuthenticatedGraphQLContext, PipelineReorderArgs } from "@/types/resolvers";

export const pipelineReorder = async (
  _: unknown,
  { ids, positions }: PipelineReorderArgs,
  ctx: AuthenticatedGraphQLContext,
): Promise<boolean> => {
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
};
