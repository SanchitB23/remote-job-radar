export const CLERK_JWK_URL = process.env.CLERK_JWK_URL || "";
export const CLERK_JWT_ISSUER = process.env.CLERK_JWT_ISSUER || "";
export const GQL_API_CORS_ORIGIN = process.env.GQL_API_CORS_ORIGIN || "";
export const EMBEDDER_BASE_URL = process.env.EMBEDDER_BASE_URL || "";
export const GQL_API_BASE_URL = process.env.GQL_API_BASE_URL || "";
export const GQL_API_PORT = process.env.GQL_API_PORT || "";
export const MAX_SKILLS_LEN: number = parseInt(process.env.MAX_SKILLS_LEN || "64", 10);
export const IVFFLAT_PROBES: number = parseInt(process.env.IVFFLAT_PROBES || "10", 10);
