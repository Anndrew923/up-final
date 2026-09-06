import { doc, getDoc } from 'firebase/firestore';
import { MONETIZATION_CONFIG } from '../config/monetization';
import {
  buildGenesisSeatEarlyFallback,
  buildGenesisSeatEndedSummary,
  GENESIS_SEAT_SUMMARY_ERROR_RETRY_TTL_MS,
  parseGenesisSeatPublicSummary,
  ttlMsForGenesisSeatStage,
  type GenesisSeatPublicSummary,
} from '../logic/core/genesisSeatSummary';
import {
  GENESIS_SEAT_PUBLIC_SUMMARY_COLLECTION,
  GENESIS_SEAT_PUBLIC_SUMMARY_DOC_ID,
} from './firestorePaths';
import { getCurrentFirebaseUser, getFirestoreDb } from './firebaseClient';

type MemoryCache = {
  summary: GenesisSeatPublicSummary;
  fetchedAt: number;
  /** Soft entries use a short retry TTL (guest poison / network miss). */
  soft?: boolean;
};

/** Process-wide singleton — independent of ladder shard / tab. */
let memoryCache: MemoryCache | null = null;
let inFlight: Promise<GenesisSeatPublicSummary> | null = null;

export function clearGenesisSeatSummaryCache(): void {
  memoryCache = null;
  inFlight = null;
}

function defaultSeatLimit(): number {
  return MONETIZATION_CONFIG.genesisEarlyBirdSeatLimit;
}

function earlyFallback(): GenesisSeatPublicSummary {
  return buildGenesisSeatEarlyFallback(defaultSeatLimit());
}

function endedFromPaywall(): GenesisSeatPublicSummary {
  return buildGenesisSeatEndedSummary(defaultSeatLimit());
}

function isCacheFresh(cache: MemoryCache, now: number): boolean {
  const ttl = cache.soft
    ? GENESIS_SEAT_SUMMARY_ERROR_RETRY_TTL_MS
    : ttlMsForGenesisSeatStage(cache.summary.stage);
  return now - cache.fetchedAt < ttl;
}

function writeCache(summary: GenesisSeatPublicSummary, fetchedAt: number, soft = false): void {
  memoryCache = { summary, fetchedAt, soft: soft || undefined };
}

/**
 * Fetch staged genesis seat FOMO summary (singleton + stage-aware TTL).
 * WHY: Never block ladder reads — any auth/network/parse miss degrades to early (or ended
 * when the client paywall flag is already on). Guest fallbacks must NOT poison the
 * singleton with a 30m early TTL, or post-login signed-in fetches would be skipped.
 */
export async function fetchGenesisSeatSummary(options?: {
  force?: boolean;
  now?: number;
}): Promise<GenesisSeatPublicSummary> {
  const now = options?.now ?? Date.now();

  if (MONETIZATION_CONFIG.leaderboardPaywallEnabled) {
    const ended = endedFromPaywall();
    writeCache(ended, now);
    return ended;
  }

  if (!options?.force && memoryCache && isCacheFresh(memoryCache, now)) {
    return memoryCache.summary;
  }

  const user = getCurrentFirebaseUser();
  if (!user || user.isAnonymous) {
    // WHY: Do not cache — signing in within early TTL must still hit Firestore.
    return earlyFallback();
  }

  const db = getFirestoreDb();
  if (!db) {
    return earlyFallback();
  }

  if (inFlight) return inFlight;

  // Capture call clock so tests can inject `now` and soft-TTL math stays deterministic.
  const fetchClock = now;

  inFlight = (async () => {
    try {
      const snap = await getDoc(
        doc(db, GENESIS_SEAT_PUBLIC_SUMMARY_COLLECTION, GENESIS_SEAT_PUBLIC_SUMMARY_DOC_ID)
      );
      if (!snap.exists()) {
        // Cold start before first claim — legitimate early, long TTL OK.
        const summary = earlyFallback();
        writeCache(summary, fetchClock);
        return summary;
      }
      const parsed = parseGenesisSeatPublicSummary(snap.data());
      if (!parsed) {
        const summary = earlyFallback();
        writeCache(summary, fetchClock, true);
        return summary;
      }
      writeCache(parsed, fetchClock);
      return parsed;
    } catch {
      const summary = earlyFallback();
      writeCache(summary, fetchClock, true);
      return summary;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
