import { bookmark } from "./mutations/bookmark.js";
import { pipelineReorder } from "./mutations/pipelineReorder.js";
import { pipelineUpsert } from "./mutations/pipelineUpsert.js";

export function getMutationResolvers(_prisma: unknown): any {
  // The split resolvers use ctx.prisma, so _prisma is not needed here
  return {
    bookmark,
    pipelineUpsert,
    pipelineReorder,
  };
}
