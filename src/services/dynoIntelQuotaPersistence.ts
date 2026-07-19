import type { DynoIntelQuotaTier } from '../logic/core/dynoIntelTypes';

const STORAGE_PREFIX = 'up:dyno-intel-quota:v1:';

export interface PersistedDynoIntelQuota {
  remaining: number;
  limit: number;
  quotaTier: DynoIntelQuotaTier;
  resetAt: string;
}

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}${uid}`;
}

export function loadPersistedDynoIntelQuota(
  uid: string,
  now: Date = new Date()
): PersistedDynoIntelQuota | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedDynoIntelQuota>;
    const resetAtMs = typeof parsed.resetAt === 'string' ? Date.parse(parsed.resetAt) : Number.NaN;
    if (
      !Number.isFinite(parsed.remaining) ||
      !Number.isFinite(parsed.limit) ||
      (parsed.limit as number) <= 0 ||
      (parsed.quotaTier !== 'trial' && parsed.quotaTier !== 'pro') ||
      !Number.isFinite(resetAtMs) ||
      resetAtMs <= now.getTime()
    ) {
      window.localStorage.removeItem(storageKey(uid));
      return null;
    }
    const limit = Math.floor(parsed.limit as number);
    return {
      remaining: Math.min(limit, Math.max(0, Math.floor(parsed.remaining as number))),
      limit,
      quotaTier: parsed.quotaTier,
      resetAt: parsed.resetAt as string,
    };
  } catch {
    return null;
  }
}

export function savePersistedDynoIntelQuota(uid: string, quota: PersistedDynoIntelQuota): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(uid), JSON.stringify(quota));
  } catch {
    // Quota display remains functional in memory when storage is unavailable.
  }
}

export function clearPersistedDynoIntelQuota(uid: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(storageKey(uid));
  } catch {
    // Storage may be unavailable in private/restricted environments.
  }
}
