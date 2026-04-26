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
}

const DEFAULT_PREVIEW_TTL_MS = 120000;
const previewCache = new Map<string, { item: LadderUserPreview; cachedAt: number }>();
const AGE_BUCKET_SET = new Set<LadderAgeBucket>(['under-20', '20-29', '30-39', '40-49', '50-59', '60-69', '70+']);
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

function readCache(uid: string, nowMs: number, ttlMs: number): LadderUserPreview | null {
  const cached = previewCache.get(uid);
  if (!cached) return null;
  if (nowMs - cached.cachedAt > ttlMs) {
    previewCache.delete(uid);
    return null;
  }
  return cached.item;
}

function writeCache(uid: string, item: LadderUserPreview, nowMs: number): void {
  previewCache.set(uid, { item, cachedAt: nowMs });
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
    typeof data.radarUpdatedAt === 'string' && data.radarUpdatedAt.length > 0 ? data.radarUpdatedAt : undefined;

  return {
    uid,
    displayName: typeof data.displayName === 'string' ? data.displayName : uid,
    avatarUrl: typeof data.avatarUrl === 'string' && data.avatarUrl.length > 0 ? data.avatarUrl : undefined,
    gender: data.gender === 'male' || data.gender === 'female' ? data.gender : undefined,
    ageBucket: typeof data.ageBucket === 'string' && AGE_BUCKET_SET.has(data.ageBucket as LadderAgeBucket)
      ? (data.ageBucket as LadderAgeBucket)
      : undefined,
    jobCategory:
      typeof data.jobCategory === 'string' && JOB_CATEGORY_SET.has(data.jobCategory as LadderJobCategory)
        ? (data.jobCategory as LadderJobCategory)
        : undefined,
    countryCode: typeof data.countryCode === 'string' ? data.countryCode : undefined,
    city: typeof data.city === 'string' ? data.city : undefined,
    district: typeof data.district === 'string' ? data.district : undefined,
    weeklyTrainingHours: typeof data.weeklyTrainingHours === 'number' ? data.weeklyTrainingHours : null,
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
  const ttlMs = params.ttlMs ?? DEFAULT_PREVIEW_TTL_MS;
  const nowMs = Date.now();
  const cached = readCache(uid, nowMs, ttlMs);
  if (cached) {
    return { ok: true, item: cached, fromCache: true };
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
