// ── Cache en mémoire partagé entre tous les modules API ──────────────────────

const store: Record<string, { data: unknown; expireAt: number }> = {};

export function getCached<T>(key: string): T | null {
  const entry = store[key];
  if (entry && Date.now() < entry.expireAt) return entry.data as T;
  return null;
}

export function setCache(key: string, data: unknown, ttlSeconds: number): void {
  store[key] = { data, expireAt: Date.now() + ttlSeconds * 1000 };
}

export function invalidateCache(prefix: string): void {
  for (const key of Object.keys(store)) {
    if (key.startsWith(prefix)) delete store[key];
  }
}
