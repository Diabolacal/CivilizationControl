export function normalizeStorageScopeValue(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function getBrowserStorageForScope(scopeKey: string | null): Storage | null {
  if (typeof window === "undefined") return null;
  return scopeKey ? window.localStorage : window.sessionStorage;
}

export function buildScopedStorageKey(prefix: string, nodeId: string, scopeKey: string | null): string {
  return scopeKey ? `${prefix}:${scopeKey}:${nodeId}` : `${prefix}:session:${nodeId}`;
}

export function removeScopedStorageItem(storage: Storage | null, storageKey: string): void {
  if (!storage) return;

  try {
    storage.removeItem(storageKey);
  } catch {
    // Storage can fail in private modes; persistence should fail open.
  }
}