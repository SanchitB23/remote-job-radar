import { Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";

import type { AuthenticatedGraphQLContext, PipelineUpsertArgs } from "@/types/resolvers";

// Define allowed pipeline columns here to keep validation centralized.
const ALLOWED_COLUMNS = ["wishlist", "applied", "interview", "offer", "closed"] as const;

export const pipelineUpsert = async (
  _: unknown,
  { jobId, column, position }: PipelineUpsertArgs,
  ctx: AuthenticatedGraphQLContext,
): Promise<boolean> => {
  // Authorization
  if (!ctx.userId) {
    throw new GraphQLError("UNAUTHENTICATED", { extensions: { code: "UNAUTHENTICATED" } });
  }

  try {
    // Basic input validation with explicit GraphQL error codes
    if (typeof jobId !== "string" || jobId.trim() === "") {
      throw new GraphQLError("Invalid jobId", { extensions: { code: "BAD_USER_INPUT" } });
    }

    // Narrow `column` to a union of allowed column strings using a type guard
    const isAllowedColumn = (c: unknown): c is (typeof ALLOWED_COLUMNS)[number] => {
      return typeof c === "string" && (ALLOWED_COLUMNS as readonly string[]).includes(c);
    };

    if (!isAllowedColumn(column)) {
      throw new GraphQLError(`Invalid column. Allowed values: ${ALLOWED_COLUMNS.join(", ")}`, {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    if (typeof position !== "number" || !Number.isInteger(position) || position < 0) {
      throw new GraphQLError("Position must be a non-negative integer", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Ensure the job exists before upserting a pipeline item
    const job = await ctx.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      // Not exposing internal DB details to client — provide a clear, typed GraphQL error
      throw new GraphQLError("Job not found", { extensions: { code: "NOT_FOUND" } });
    }

    await ctx.prisma.pipelineItem.upsert({
      where: { user_id_job_id: { user_id: ctx.userId, job_id: jobId } },
      create: { user_id: ctx.userId, job_id: jobId, column, position },
      update: { column, position },
    });

    return true;
  } catch (err) {
    // Preserve GraphQLError so client can receive structured extensions
    if (err instanceof GraphQLError) throw err;

    // Handle Prisma known request errors to provide better client feedback
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // Foreign key violations (e.g., missing referenced user or job)
      if (err.code === "P2003") {
        const constraint = (err.meta as Record<string, unknown>)?.constraint as string | undefined;
        console.error("[pipelineUpsert] Prisma P2003 (FK) meta:", err.meta);

        if (constraint?.includes("user_id")) {
          throw new GraphQLError("User not found", { extensions: { code: "NOT_FOUND" } });
        }
        if (constraint?.includes("job_id")) {
          throw new GraphQLError("Job not found", { extensions: { code: "NOT_FOUND" } });
        }

        // Generic foreign key error fallback
        throw new GraphQLError("Foreign key constraint violated", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Unique constraint violation
      if (err.code === "P2002") {
        console.error("[pipelineUpsert] Prisma P2002 (unique) meta:", err.meta);
        throw new GraphQLError("Conflict: item already exists", {
          extensions: { code: "CONFLICT" },
        });
      }
    }

    // Log full error server-side for debugging without leaking internals to the client
    console.error("[pipelineUpsert] unexpected error:", err);

    // Wrap other errors as generic internal server errors
    throw new GraphQLError("Internal server error", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};
