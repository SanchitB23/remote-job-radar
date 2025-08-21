import { GraphQLError } from "graphql";

import type {
  AuthenticatedGraphQLContext,
  FilterMetadataResult,
  LocationGroupResult,
  SourceResult,
  WorkTypeGroupResult,
} from "@/types/resolvers";

export const filterMetadata = async (
  _: unknown,
  __: unknown,
  ctx: AuthenticatedGraphQLContext,
): Promise<FilterMetadataResult> => {
  if (!ctx.userId) {
    throw new GraphQLError("UNAUTHENTICATED", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  try {
    const fitScoreStats = await ctx.prisma.job.aggregate({
      _min: { fit_score: true },
      _max: { fit_score: true },
      where: { fit_score: { not: null } },
    });
    const salaryStats = await ctx.prisma.job.aggregate({
      _min: { salary_min: true },
      _max: { salary_max: true },
      where: {
        OR: [{ salary_min: { not: null } }, { salary_max: { not: null } }],
      },
    });
    const sourceResults = await ctx.prisma.job.findMany({
      select: { source: true },
      distinct: ["source"],
    });
    const sources = sourceResults
      .map((s: SourceResult) => s.source)
      .filter((source: string) => source && source.trim() !== "");
    const locations = await ctx.prisma.job.groupBy({
      by: ["location"],
      _count: { location: true },
      where: {
        location: {
          not: null,
          notIn: ["", "Remote", "Worldwide"],
        },
      },
      orderBy: { _count: { location: "desc" } },
      take: 50,
    });
    const workTypes = await ctx.prisma.job.groupBy({
      by: ["work_type"],
      _count: { work_type: true },
      where: {
        work_type: {
          not: null,
          notIn: [""],
        },
      },
      orderBy: { _count: { work_type: "desc" } },
      take: 50,
    });
    return {
      fitScore: {
        min: fitScoreStats._min.fit_score ?? 0,
        max: fitScoreStats._max.fit_score ?? 100,
      },
      salary: {
        min: salaryStats._min.salary_min ?? 0,
        max: salaryStats._max.salary_max ?? 0,
      },
      sources: sources.map((s: string) => s.toUpperCase()).filter(Boolean),
      locations: locations.map((l: LocationGroupResult) => l.location).filter(Boolean),
      workTypes: workTypes.map((w: WorkTypeGroupResult) => w.work_type).filter(Boolean),
    };
  } catch (error) {
    console.error("Error in filterMetadata query:", error);
    throw new GraphQLError("Failed to fetch filter metadata");
  }
};
