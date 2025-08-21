import { EMBEDDER_BASE_URL } from "../constants/index.js";

export async function embedText(text: string): Promise<number[]> {
  const r = await fetch(EMBEDDER_BASE_URL + "/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`Failed to generate embedding: ${r.status} ${r.statusText}`);
  const j = await r.json();
  if (!Array.isArray(j.vector)) {
    throw new Error(
      `Invalid embedder response: expected 'vector' to be an array but received ${typeof j.vector} (${JSON.stringify(j.vector)})`,
    );
  }
  return j.vector as number[]; // 384-d
}
