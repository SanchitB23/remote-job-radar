import { bookmark } from "./mutations/bookmark";
import { pipelineReorder } from "./mutations/pipelineReorder";
import { pipelineUpsert } from "./mutations/pipelineUpsert";

export function getMutationResolvers(_prisma: unknown): any {
  // The split resolvers use ctx.prisma, so _prisma is not needed here
  return {
    bookmark,
    pipelineUpsert,
    pipelineReorder,
  };
}
