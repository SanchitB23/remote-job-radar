import { GraphQLError } from "graphql";
import { uniqueClean, withTimeout } from "utils/index.js";

import type { AuthenticatedGraphQLContext, SetUserSkillsResponse } from "@/types/resolvers";

import { MAX_SKILLS_LEN } from "../../../constants/index.js";
import { embedText } from "../../../lib/embedder.js";

const QUICK_EMBED_TIMEOUT_MS = 5000;

export const setSkills = async (
  _: unknown,
  { skills }: { skills: string[] },
  ctx: AuthenticatedGraphQLContext,
): Promise<SetUserSkillsResponse> => {
  try {
    if (!ctx.userId) throw new GraphQLError("UNAUTHENTICATED");
    console.log(`[setSkills] userId: ${ctx.userId}, skills:`, skills);
    const cleaned = uniqueClean(skills, MAX_SKILLS_LEN);

    // 1) Persist skills via Prisma (no raw SQL)
    try {
      await ctx.prisma.user_profile.upsert({
        where: { user_id: ctx.userId },
        create: { user_id: ctx.userId, skills: cleaned },
        update: { skills: cleaned, updated_at: new Date() },
      });
    } catch (err) {
      console.error("[setSkills] upsert skills failed:", err);
      throw new GraphQLError("Failed to save skills");
    }

    try {
      const text = cleaned.join(" ");
      const vec = await withTimeout(embedText(text), QUICK_EMBED_TIMEOUT_MS);
      // vector write needs cast -> use parameterized $executeRaw (safe)
      await ctx.prisma.$executeRaw`
      UPDATE "user_profiles"
      SET "skill_vector" = ${vec}::float8[]::vector,
          "updated_at"   = now()
      WHERE "user_id" = ${ctx.userId}
    `;

      // best-effort cleanup any stale queue row
      await ctx.prisma.user_profile_embed_jobs.deleteMany({ where: { user_id: ctx.userId } });

      return { ok: true, embedding: "UPDATED" };
    } catch (embedErr) {
      console.error(`[setSkills] Error embedding skills:`, embedErr, "Queued for next run");
      // 3) Enqueue for aggregator to process
      await ctx.prisma.user_profile_embed_jobs.upsert({
        where: { user_id: ctx.userId },
        create: {
          user_id: ctx.userId,
          skills: cleaned,
          status: "pending",
          attempts: 0,
          next_run_at: new Date(),
        },
        update: {
          skills: cleaned,
          status: "pending",
          next_run_at: new Date(),
        },
      });

      return { ok: true, embedding: "QUEUED" };
    }
  } catch (err) {
    console.error(`[setSkills] Error:`, err);
    throw err;
  }
};
