import { bookmark, pipelineReorder, pipelineUpsert } from "./mutations/index.js";

export function getMutationResolvers(_prisma: unknown): any {
  // The split resolvers use ctx.prisma, so _prisma is not needed here
  return {
    bookmark,
    pipelineUpsert,
    pipelineReorder,
  };
}
