import { doc, getDoc } from 'firebase/firestore';
import { shouldBlockFirebase } from '../logic/core/entitlement';
import {
  countPreviewRadarAxesFilled,
  isPreviewRadarComplete,
  LEADERBOARD_PREVIEW_SCHEMA_VERSION,
} from '../logic/core/leaderboardPreviewContract';
import type { EntitlementState } from '../types/entitlement';
import type { LadderAgeBucket, LadderGender, LadderJobCategory } from '../types/ladderProfile';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../types/scoring';
import { getFirestoreDb } from './firebaseClient';
import { LEADERBOARD_PREVIEWS_COLLECTION } from './firestorePaths';
import type { LeaderboardEntry } from './leaderboardCacheService';
import { sanitizeAvatarUrlForLeaderboard } from './ladderIdentityService';

export interface LadderUserPreview {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  gender?: LadderGender;
  ageBucket?: LadderAgeBucket;
  jobCategory?: LadderJobCategory;
  countryCode?: string;
  city?: string;
  district?: string;
  weeklyTrainingHours?: number | null;
  trainingYears?: number | null;
  isAnonymousInLadder?: boolean;
  radarScores?: Partial<Record<SixAxisMetric, number>>;
  /** Stored contract version; missing treated as v1. */
  schemaVersion?: number;
  radarAxisCount?: number;
  radarComplete?: boolean;
  radarUpdatedAt?: string;
  updatedAt: string;
}

export interface GetLadderUserPreviewResult {
  ok: boolean;
  reason?: 'pro-required' | 'not-found' | 'unknown';
  item?: LadderUserPreview | null;
  fromCache?: boolean;
  stale?: boolean;
}

export const LEADERBOARD_PREVIEW_TTL_MS = 120_000;
export const LEADERBOARD_PREVIEW_SWR_MAX_AGE_MS = 15 * 60 * 1000;
const DISK_STORAGE_PREFIX = 'up:leaderboard-preview:v1:';

const previewCache = new Map<string, { item: LadderUserPreview; cachedAt: number }>();
const previewRevalidateInFlight = new Set<string>();

const AGE_BUCKET_SET = new Set<LadderAgeBucket>([
  'under-20',
  '20-29',
  '30-39',
  '40-49',
  '50-59',
  '60-69',
  '70+',
]);
const JOB_CATEGORY_SET = new Set<LadderJobCategory>([
  'engineering',
  'medical',
  'coach',
  'student',
  'police_military',
  'business',
  'freelance',
  'service',
  'professional_athlete',
  'artist_performer',
  'other',
]);

type PreviewLookup = {
  item: LadderUserPreview;
  freshness: 'fresh' | 'stale';
  cachedAt: number;
};

function diskKey(uid: string): string {
  return `${DISK_STORAGE_PREFIX}${uid}`;
}

function readDiskPreview(uid: string): { item: LadderUserPreview; cachedAt: number } | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(diskKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { item?: LadderUserPreview; cachedAt?: number };
    if (!parsed?.item || typeof parsed.cachedAt !== 'number' || !Number.isFinite(parsed.cachedAt)) {
      window.localStorage.removeItem(diskKey(uid));
      return null;
    }
    return { item: parsed.item, cachedAt: parsed.cachedAt };
  } catch {
    return null;
  }
}

function writeDiskPreview(uid: string, item: LadderUserPreview, cachedAt: number): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(diskKey(uid), JSON.stringify({ item, cachedAt }));
  } catch {
    // ignore
  }
}

function lookupPreview(
  uid: string,
  nowMs: number,
  ttlMs: number,
  swrMaxAgeMs: number
): PreviewLookup | null {
  const memory = previewCache.get(uid);
  if (memory) {
    const age = nowMs - memory.cachedAt;
    if (age <= ttlMs) return { item: memory.item, freshness: 'fresh', cachedAt: memory.cachedAt };
    if (age <= swrMaxAgeMs) return { item: memory.item, freshness: 'stale', cachedAt: memory.cachedAt };
    previewCache.delete(uid);
  }

  const disk = readDiskPreview(uid);
  if (disk) {
    const age = nowMs - disk.cachedAt;
    if (age <= ttlMs) {
      previewCache.set(uid, disk);
      return { item: disk.item, freshness: 'fresh', cachedAt: disk.cachedAt };
    }
    if (age <= swrMaxAgeMs) {
      // WHY: Returning from background — serve disk preview instantly, refresh in background.
      previewCache.set(uid, disk);
      return { item: disk.item, freshness: 'stale', cachedAt: disk.cachedAt };
    }
  }

  return null;
}

function writeCache(uid: string, item: LadderUserPreview, nowMs: number): void {
  previewCache.set(uid, { item, cachedAt: nowMs });
  writeDiskPreview(uid, item, nowMs);
}

function schedulePreviewRevalidate(entitlement: EntitlementState, uid: string): void {
  if (previewRevalidateInFlight.has(uid)) return;
  if (shouldBlockFirebase(entitlement, 'leaderboard-read')) return;
  const db = getFirestoreDb();
  if (!db) return;
  previewRevalidateInFlight.add(uid);
  void (async () => {
    try {
      if (shouldBlockFirebase(entitlement, 'leaderboard-read')) return;
      const ref = doc(db, LEADERBOARD_PREVIEWS_COLLECTION, uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const item = mapPreview(snap.data() as Record<string, unknown>, uid);
      writeCache(uid, item, Date.now());
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[leaderboard] preview SWR revalidate failed', err);
      }
    } finally {
      previewRevalidateInFlight.delete(uid);
    }
  })();
}

function mapPreview(data: Record<string, unknown>, uid: string): LadderUserPreview {
  const radarRaw = data.radarScores;
  const radarScores: Partial<Record<SixAxisMetric, number>> = {};
  if (radarRaw && typeof radarRaw === 'object') {
    const record = radarRaw as Record<string, unknown>;
    for (const key of SIX_AXIS_METRICS) {
      const v = record[key];
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
        radarScores[key] = v;
      }
    }
  }

  const schemaVersionRaw = data.schemaVersion;
  const schemaVersion =
    typeof schemaVersionRaw === 'number' && Number.isFinite(schemaVersionRaw)
      ? schemaVersionRaw
      : LEADERBOARD_PREVIEW_SCHEMA_VERSION;
  const radarAxisCount = countPreviewRadarAxesFilled(radarScores);
  const radarComplete = isPreviewRadarComplete(radarScores);
  const radarUpdatedAt =
    typeof data.radarUpdatedAt === 'string' && data.radarUpdatedAt.length > 0
      ? data.radarUpdatedAt
      : undefined;

  return {
    uid,
    displayName: typeof data.displayName === 'string' ? data.displayName : uid,
    avatarUrl:
      typeof data.avatarUrl === 'string' && data.avatarUrl.length > 0 ? data.avatarUrl : undefined,
    gender: data.gender === 'male' || data.gender === 'female' ? data.gender : undefined,
    ageBucket:
      typeof data.ageBucket === 'string' && AGE_BUCKET_SET.has(data.ageBucket as LadderAgeBucket)
        ? (data.ageBucket as LadderAgeBucket)
        : undefined,
    jobCategory:
      typeof data.jobCategory === 'string' &&
      JOB_CATEGORY_SET.has(data.jobCategory as LadderJobCategory)
        ? (data.jobCategory as LadderJobCategory)
        : undefined,
    countryCode: typeof data.countryCode === 'string' ? data.countryCode : undefined,
    city: typeof data.city === 'string' ? data.city : undefined,
    district: typeof data.district === 'string' ? data.district : undefined,
    weeklyTrainingHours:
      typeof data.weeklyTrainingHours === 'number' ? data.weeklyTrainingHours : null,
    trainingYears: typeof data.trainingYears === 'number' ? data.trainingYears : null,
    isAnonymousInLadder: data.isAnonymousInLadder === true,
    radarScores,
    schemaVersion,
    radarAxisCount,
    radarComplete,
    radarUpdatedAt,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
  };
}

/**
 * Graceful degradation when `leaderboard_previews/{uid}` is missing but the list row exists.
 * WHY: Batch uploads may lag preview sync; list entry is still authoritative for public summary fields.
 */
export function buildLadderUserPreviewFromEntry(entry: LeaderboardEntry): LadderUserPreview {
  const isAnonymous = entry.isAnonymousInLadder === true;
  const jobRaw = entry.jobCategory;
  const resolvedJobCategory =
    typeof jobRaw === 'string' && jobRaw.length > 0 ? (jobRaw as LadderJobCategory) : undefined;
  return {
    uid: entry.uid,
    displayName: isAnonymous ? 'Anonymous' : entry.displayName?.trim() || entry.uid,
    avatarUrl: isAnonymous
      ? undefined
      : sanitizeAvatarUrlForLeaderboard(entry.avatarUrl),
    gender: entry.gender,
    ageBucket: entry.ageBucket,
    jobCategory: resolvedJobCategory,
    countryCode: entry.countryCode,
    city: entry.city,
    district: entry.district,
    isAnonymousInLadder: isAnonymous,
    radarScores: {},
    schemaVersion: LEADERBOARD_PREVIEW_SCHEMA_VERSION,
    radarAxisCount: 0,
    radarComplete: false,
    updatedAt: entry.updatedAt,
  };
}

export async function getLadderUserPreview(params: {
  entitlement: EntitlementState;
  uid: string;
  ttlMs?: number;
}): Promise<GetLadderUserPreviewResult> {
  if (shouldBlockFirebase(params.entitlement, 'leaderboard-read')) {
    return { ok: false, reason: 'pro-required', item: null };
  }
  const uid = params.uid.trim();
  if (!uid) return { ok: false, reason: 'not-found', item: null };
  const ttlMs = params.ttlMs ?? LEADERBOARD_PREVIEW_TTL_MS;
  const nowMs = Date.now();
  const cached = lookupPreview(uid, nowMs, ttlMs, LEADERBOARD_PREVIEW_SWR_MAX_AGE_MS);
  if (cached?.freshness === 'fresh') {
    return { ok: true, item: cached.item, fromCache: true };
  }
  if (cached?.freshness === 'stale') {
    schedulePreviewRevalidate(params.entitlement, uid);
    return { ok: true, item: cached.item, fromCache: true, stale: true };
  }

  const db = getFirestoreDb();
  if (!db) return { ok: false, reason: 'unknown', item: null };

  try {
    const ref = doc(db, LEADERBOARD_PREVIEWS_COLLECTION, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { ok: false, reason: 'not-found', item: null };
    }
    const item = mapPreview(snap.data() as Record<string, unknown>, uid);
    writeCache(uid, item, nowMs);
    return { ok: true, item, fromCache: false };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[leaderboard] getLadderUserPreview error', err);
    }
    return { ok: false, reason: 'unknown', item: null };
  }
}
