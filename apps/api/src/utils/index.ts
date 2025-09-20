export function uniqueClean(skills: string[], max: number): string[] {
  return Array.from(
    new Set((skills ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean)),
  ).slice(0, max);
}

export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms)),
  ]);
}
