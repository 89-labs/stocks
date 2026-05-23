interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export function memGet<T>(key: string): T | null {
  const entry = store.get(key) as Entry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function memSet<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function memGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = memGet<T>(key);
  if (cached !== null) return cached;
  const value = await fetcher();
  memSet(key, value, ttlSeconds);
  return value;
}

export function memDelete(key: string): void {
  store.delete(key);
}

/** Remove in-memory cache entries whose keys match the predicate */
export function memClear(predicate: (key: string) => boolean): void {
  for (const key of store.keys()) {
    if (predicate(key)) store.delete(key);
  }
}
