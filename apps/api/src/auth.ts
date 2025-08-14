// apps/api/src/auth.ts
import jwksRsa from "jwks-rsa";
import jwt from "jsonwebtoken";
import type { Request } from "express";

const jwkClient = jwksRsa({
  jwksUri: process.env.CLERK_JWK_URL!,
  cache: true,
  cacheMaxEntries: 5,
  timeout: 30000,
});

export async function getUserId(req: Request): Promise<string | null> {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return null;

    const decoded = jwt.decode(token, { complete: true }) as any;
    if (!decoded?.header?.kid) {
      console.warn("JWT token missing kid in header");
      return null;
    }

    const kid = decoded.header.kid;

    const key = await jwkClient.getSigningKey(kid);
    const payload: any = jwt.verify(token, key.getPublicKey(), {
      issuer: process.env.CLERK_JWT_ISSUER,
      algorithms: ["RS256"],
    });

    console.log("✅ JWT verified for user:", payload.sub);
    return payload.sub; // Clerk user ID
  } catch (error) {
    console.warn(
      "JWT verification failed:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
