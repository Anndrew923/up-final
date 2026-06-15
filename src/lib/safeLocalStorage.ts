/**
 * Browser localStorage with SSR / privacy-mode guards.
 * No-op when `localStorage` is unavailable or throws (quota, Safari private, etc.).
 */

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function safeGetItem(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // quota exceeded or blocked
  }
}

export function safeRemoveItem(key: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

export function listStorageKeys(): string[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}
