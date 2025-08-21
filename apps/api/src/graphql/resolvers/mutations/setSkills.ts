import { GraphQLError } from "graphql";
import { embedText } from "lib/embedder";

import type { AuthenticatedGraphQLContext } from "@/types/resolvers";

const MAX_SKILLS = 64;

export const setSkills = async (
  _: unknown,
  { skills }: { skills: string[] },
  ctx: AuthenticatedGraphQLContext,
): Promise<boolean> => {
  if (!ctx.userId) throw new GraphQLError("UNAUTHENTICATED");
  const cleaned = (skills || [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SKILLS);

  const text = cleaned.join(" ");
  const vec = await embedText(text); // 384-d from FastEmbed

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
  return true;
};
