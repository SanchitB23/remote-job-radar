import { filterMetadata } from "./queries/filterMetadata";
import { jobs } from "./queries/jobs";
import { pipeline } from "./queries/pipeline";

/**
 * Returns an object containing GraphQL query resolvers for jobs and pipeline items.
 *
 * @param _prisma - The Prisma client instance used for database operations.
 * @returns An object with resolvers for the `jobs`, `pipeline`, and `filterMetadata` queries.
 */
export function getQueryResolvers(_prisma: unknown): any {
  // The split resolvers use ctx.prisma, so _prisma is not needed here
  return {
    jobs,
    pipeline,
    filterMetadata,
  };
}
