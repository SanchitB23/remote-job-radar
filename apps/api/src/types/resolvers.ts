import type { PrismaClient } from "@prisma/client";

// Context type for GraphQL resolvers
export interface GraphQLContext {
  userId?: string;
  prisma: PrismaClient;
}

// Authenticated context type
export interface AuthenticatedGraphQLContext extends GraphQLContext {
  userId: string;
}

// Job query arguments
export interface JobsQueryArgs {
  minFit?: number;
  search?: string;
  minSalary?: number;
  location?: string;
  workType?: string;
  sources?: string[];
  sortBy?: "FIT" | "DATE" | "SALARY";
  first?: number;
  after?: string;
  bookmarked?: boolean;
  isTracked?: boolean;
}

// Pipeline mutation arguments
export interface BookmarkArgs {
  id: string;
}

export interface PipelineUpsertArgs {
  jobId: string;
  column: string;
  position: number;
}

export interface PipelineReorderArgs {
  ids: string[];
  positions: number[];
}

// Subscription arguments
export interface NewJobSubscriptionArgs {
  minFit?: number;
}

// Job field resolver parent type
export interface JobParent {
  id: string;
  source: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  work_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  url: string;
  published_at: Date;
  fit_score: number | null;
  vector?: unknown;
}

// Source result types for aggregation queries
export interface SourceResult {
  source: string;
}

export interface LocationGroupResult {
  location: string | null;
  _count: { location: number };
}

export interface WorkTypeGroupResult {
  work_type: string | null;
  _count: { work_type: number };
}

// PubSub interface
export interface PubSubInterface {
  asyncIterator(triggerName: string): AsyncIterator<unknown>;
}

export interface FilterMetadataResult {
  fitScore: { min: number; max: number };
  salary: { min: number; max: number };
  sources: string[];
  locations: (string | null)[];
  workTypes: (string | null)[];
}

export interface JobResult {
  id: string;
  source: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  workType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  url: string | null;
  publishedAt: Date | null;
  vector: unknown | null;
  fitScore: number;
}
