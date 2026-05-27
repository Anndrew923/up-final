import {
  checkFullSyncRateLimit,
  normalizeFullSyncRateLimitState,
  recordFullSyncRateLimitSuccess,
  type FullSyncRateLimitCheck,
  type FullSyncRateLimitState,
} from '../logic/core/fullSyncRateLimit';
import { FULL_SYNC_MAX_PER_DAY } from '../logic/core/ladderUploadPolicy';

const STORAGE_KEY_PREFIX = 'up_ladder_full_sync_v1';

/** Fallback when `localStorage` is unavailable (SSR, some test runners). */
const memoryFallback = new Map<string, FullSyncRateLimitState>();

function storageKey(uid: string): string {
  return `${STORAGE_KEY_PREFIX}:${uid}`;
}

function parseStoredState(raw: string): FullSyncRateLimitState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<FullSyncRateLimitState>;
    if (
      typeof parsed.dayKey !== 'string' ||
      typeof parsed.countToday !== 'number' ||
      !Number.isFinite(parsed.countToday)
    ) {
      return null;
    }
    return {
      dayKey: parsed.dayKey,
      countToday: Math.min(
        FULL_SYNC_MAX_PER_DAY,
        Math.max(0, Math.floor(parsed.countToday))
      ),
      lastCompletedAt:
        typeof parsed.lastCompletedAt === 'string' ? parsed.lastCompletedAt : null,
    };
  } catch {
    return null;
  }
}

/** Prefer `localStorage` (survives reload); memory is session fallback only. */
function readRaw(uid: string): FullSyncRateLimitState | null {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(storageKey(uid));
      if (raw) {
        const fromStorage = parseStoredState(raw);
        if (fromStorage) {
          memoryFallback.set(uid, fromStorage);
          return fromStorage;
        }
      }
    } catch {
      // fall through to memory
    }
  }

  return memoryFallback.get(uid) ?? null;
}

function writeRaw(uid: string, state: FullSyncRateLimitState): void {
  memoryFallback.set(uid, state);

  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(state));
  } catch {
    // Quota or private mode — memory fallback still applies for this session.
  }
}

export function loadFullSyncRateLimitState(uid: string, now = new Date()): FullSyncRateLimitState {
  const raw = readRaw(uid);
  return normalizeFullSyncRateLimitState(raw, now);
}

export function checkFullSyncAllowed(uid: string, now = new Date()): FullSyncRateLimitCheck {
  const state = loadFullSyncRateLimitState(uid, now);
  return checkFullSyncRateLimit(state, now);
}

export function recordFullSyncAllowed(uid: string, now = new Date()): void {
  const state = loadFullSyncRateLimitState(uid, now);
  const next = recordFullSyncRateLimitSuccess(state, now);
  writeRaw(uid, next);
}

/** Test helper — reset persisted cap for a uid. */
export function clearFullSyncRateLimitForTests(uid: string): void {
  memoryFallback.delete(uid);
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(uid));
  } catch {
    // ignore
  }
}
