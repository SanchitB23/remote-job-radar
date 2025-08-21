// apps/api/src/auth.ts
import type { Request } from "express";
import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";

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

    const decoded = jwt.decode(token, { complete: true }) as jwt.Jwt | null;
    if (!decoded || typeof decoded !== "object" || !("header" in decoded) || !decoded.header?.kid) {
      console.warn("JWT token missing kid in header");
      return null;
    }

    const kid = decoded.header.kid;

    const key = await jwkClient.getSigningKey(kid);
    const payload = jwt.verify(token, key.getPublicKey(), {
      issuer: process.env.CLERK_JWT_ISSUER,
      algorithms: ["RS256"],
    }) as jwt.JwtPayload | string;

    if (
      typeof payload === "object" &&
      payload !== null &&
      typeof (payload as jwt.JwtPayload).sub === "string"
    ) {
      return (payload as jwt.JwtPayload).sub ?? null; // Clerk user ID
    }
    return null;
  } catch (error) {
    console.warn("JWT verification failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    if (!token) return null;

    // Remove "Bearer " prefix if present
    const cleanToken = token.replace("Bearer ", "");

    const decoded = jwt.decode(cleanToken, { complete: true }) as jwt.Jwt | null;
    if (!decoded || typeof decoded !== "object" || !("header" in decoded) || !decoded.header?.kid) {
      console.warn("JWT token missing kid in header");
      return null;
    }

    const kid = decoded.header.kid;

    const key = await jwkClient.getSigningKey(kid);
    const payload: jwt.JwtPayload | string = jwt.verify(cleanToken, key.getPublicKey(), {
      issuer: process.env.CLERK_JWT_ISSUER,
      algorithms: ["RS256"],
    });

    const sub = (payload as jwt.JwtPayload).sub;
    console.log("✅ JWT verified for user:", sub);
    return typeof sub === "string" ? sub : null; // Clerk user ID
  } catch (error) {
    console.warn("JWT verification failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
