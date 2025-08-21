import { GraphQLError } from "graphql";
import { embedText } from "lib/embedder";

import type { AuthenticatedGraphQLContext } from "@/types/resolvers";

const MAX_SKILLS = 64;

export const setSkills = async (
  _: unknown,
  { skills }: { skills: string[] },
  ctx: AuthenticatedGraphQLContext,
): Promise<boolean> => {
  try {
    if (!ctx.userId) throw new GraphQLError("UNAUTHENTICATED");
    console.log(`[setSkills] userId: ${ctx.userId}, skills:`, skills);
    const cleaned = (skills || [])
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_SKILLS);

    const text = cleaned.join(" ");
    let vec;
    try {
      vec = await embedText(text); // 384-d from FastEmbed
      console.log(`[setSkills] Embedded vector length: ${vec?.length}`);
    } catch (embedErr) {
      console.error(`[setSkills] Error embedding skills:`, embedErr);
      throw new GraphQLError("Failed to embed skills");
    }

    try {
      // Pass the vector as a parameter to avoid SQL injection
      await ctx.prisma.$executeRawUnsafe(
        `INSERT INTO "user_profiles" ("user_id","skills","skill_vector")
             VALUES ($1,$2,$3::vector)
             ON CONFLICT ("user_id")
             DO UPDATE SET "skills"=EXCLUDED."skills",
                           "skill_vector"=EXCLUDED."skill_vector",
                           "updated_at"=now()`,
        ctx.userId,
        cleaned,
        vec, // Pass the array directly; pgvector will accept array input
      );
      console.log(`[setSkills] Successfully upserted user profile for userId: ${ctx.userId}`);
    } catch (dbErr) {
      console.error(`[setSkills] DB error:`, dbErr);
      throw new GraphQLError("Failed to update user profile");
    }
    return true;
  } catch (err) {
    console.error(`[setSkills] Error:`, err);
    throw err;
  }
};
