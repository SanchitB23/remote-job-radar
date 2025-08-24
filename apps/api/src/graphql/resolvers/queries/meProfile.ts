import { GraphQLError } from "graphql";

import type { AuthenticatedGraphQLContext } from "@/types/resolvers";

export const meProfile = async (_: unknown, __: unknown, ctx: AuthenticatedGraphQLContext) => {
  const file = "meProfile.ts";
  const func = "meProfile";

  if (!ctx.userId) {
    console.error(`[${file}] [${func}] Error: UNAUTHENTICATED`);
    throw new GraphQLError("UNAUTHENTICATED", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  try {
    console.log(`[${file}] [${func}] Fetching profile for userId:`, ctx.userId);
    const profile = await ctx.prisma.user_profile.findUnique({ where: { user_id: ctx.userId } });
    if (!profile) {
      console.warn(`[${file}] [${func}] No profile found for userId:`, ctx.userId);
    } else {
      console.log(`[${file}] [${func}] Profile found for userId:`, ctx.userId, profile);
    }
    return {
      userId: profile?.user_id,
      skills: profile?.skills,
      updatedAt: profile?.updated_at,
    };
  } catch (error) {
    console.error(`[${file}] [${func}] Error in user profile query:`, error);
    throw new GraphQLError("Failed to fetch user profile");
  }
};
