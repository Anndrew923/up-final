import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { shouldBlockFirebase } from '../logic/core/entitlement';
import { buildLeaderboardProfileProjection } from '../logic/core/leaderboardProfileProjection';
import type { EntitlementState } from '../types/entitlement';
import {
  LADDER_AGE_BUCKETS,
  LADDER_COUNTRY_CODES,
  LADDER_HEIGHT_BUCKETS,
  LADDER_JOB_CATEGORIES,
  LADDER_WEIGHT_BUCKETS,
  type LadderProfileProjection,
} from '../types/ladderProfile';
import { getCurrentFirebaseUser, getFirestoreDb } from './firebaseClient';
import { loadPhysicalProfile } from './localStorageService';
import { ENTRIES_SUBCOLLECTION, LEADERBOARDS_COLLECTION } from './firestorePaths';
import { checkUploadRateLimit, consumeUploadQuota } from './rateLimitService';
import {
  clearLeaderboardCache,
  getCachedLeaderboard,
  setCachedLeaderboard,
  type LeaderboardEntry,
} from './leaderboardCacheService';

export interface SubmitLeaderboardInput {
  uid: string;
  metric:
    | 'strength'
    | 'explosivePower'
    | 'cardio'
    | 'muscleMass'
    | 'bodyFat'
    | 'armSize'
    | 'gripStrength';
  score: number;
  displayName: string;
  avatarUrl?: string;
  profile?: Partial<LadderProfileProjection>;
}

export interface SubmitLeaderboardResult {
  ok: boolean;
  reason?: 'pro-required' | 'rate-limited' | 'not-best-score' | 'invalid-input' | 'unknown';
  updated?: boolean;
}

export interface ListLeaderboardResult {
  ok: boolean;
  reason?: 'pro-required' | 'unknown';
  items?: LeaderboardEntry[];
  fromCache?: boolean;
}

const memoryDb = new Map<string, Map<string, LeaderboardEntry>>();

function getMetricStore(metric: SubmitLeaderboardInput['metric']): Map<string, LeaderboardEntry> {
  const existing = memoryDb.get(metric);
  if (existing) return existing;
  const created = new Map<string, LeaderboardEntry>();
  memoryDb.set(metric, created);
  return created;
}

function validateInput(input: SubmitLeaderboardInput): boolean {
  return (
    Boolean(input.uid && input.displayName) && Number.isFinite(input.score) && input.score >= 0
  );
}

function entriesCollection(db: Firestore, metric: string) {
  return collection(db, LEADERBOARDS_COLLECTION, metric, ENTRIES_SUBCOLLECTION);
}

function mapFirestoreDoc(d: QueryDocumentSnapshot): LeaderboardEntry {
  const data = d.data() as Record<string, unknown>;
  const updatedRaw = data.updatedAt;
  const updatedAt =
    typeof updatedRaw === 'string'
      ? updatedRaw
      : updatedRaw && typeof (updatedRaw as { toDate?: () => Date }).toDate === 'function'
        ? (updatedRaw as { toDate: () => Date }).toDate().toISOString()
        : new Date().toISOString();

  return {
    uid: d.id,
    displayName: String(data.displayName ?? ''),
    scoreBest: Number(data.scoreBest ?? 0),
    updatedAt,
    isPro: data.isPro === true,
    gender: data.gender === 'male' || data.gender === 'female' ? data.gender : undefined,
    age: typeof data.age === 'number' ? data.age : undefined,
    heightCm: typeof data.heightCm === 'number' ? data.heightCm : undefined,
    weightKg: typeof data.weightKg === 'number' ? data.weightKg : undefined,
    jobCategory:
      typeof data.jobCategory === 'string' &&
      LADDER_JOB_CATEGORIES.includes(data.jobCategory as (typeof LADDER_JOB_CATEGORIES)[number])
        ? (data.jobCategory as LadderProfileProjection['jobCategory'])
        : undefined,
    weeklyTrainingHours:
      typeof data.weeklyTrainingHours === 'number' ? data.weeklyTrainingHours : undefined,
    trainingYears: typeof data.trainingYears === 'number' ? data.trainingYears : undefined,
    countryCode:
      typeof data.countryCode === 'string' &&
      LADDER_COUNTRY_CODES.includes(data.countryCode as (typeof LADDER_COUNTRY_CODES)[number])
        ? (data.countryCode as LadderProfileProjection['countryCode'])
        : undefined,
    region: typeof data.region === 'string' ? data.region : undefined,
    city: typeof data.city === 'string' ? data.city : undefined,
    district: typeof data.district === 'string' ? data.district : undefined,
    isAnonymousInLadder:
      typeof data.isAnonymousInLadder === 'boolean' ? data.isAnonymousInLadder : undefined,
    ageBucket:
      typeof data.ageBucket === 'string' &&
      LADDER_AGE_BUCKETS.includes(data.ageBucket as (typeof LADDER_AGE_BUCKETS)[number])
        ? (data.ageBucket as LadderProfileProjection['ageBucket'])
        : undefined,
    heightBucket:
      typeof data.heightBucket === 'string' &&
      LADDER_HEIGHT_BUCKETS.includes(data.heightBucket as (typeof LADDER_HEIGHT_BUCKETS)[number])
        ? (data.heightBucket as LadderProfileProjection['heightBucket'])
        : undefined,
    weightBucket:
      typeof data.weightBucket === 'string' &&
      LADDER_WEIGHT_BUCKETS.includes(data.weightBucket as (typeof LADDER_WEIGHT_BUCKETS)[number])
        ? (data.weightBucket as LadderProfileProjection['weightBucket'])
        : undefined,
    regionScope:
      data.regionScope === 'country' || data.regionScope === 'city' || data.regionScope === 'district'
        ? data.regionScope
        : undefined,
  };
}

async function fetchFirestoreLeaderboardPage(
  db: Firestore,
  metric: string,
  page: number,
  pageSize: number
): Promise<LeaderboardEntry[]> {
  const base = entriesCollection(db, metric);
  const qBase = query(base, orderBy('scoreBest', 'desc'), limit(pageSize));

  let cursor: QueryDocumentSnapshot | undefined;
  for (let p = 1; p <= page; p++) {
    const q = cursor
      ? query(base, orderBy('scoreBest', 'desc'), startAfter(cursor), limit(pageSize))
      : qBase;
    const snap = await getDocs(q);
    if (snap.empty) {
      return [];
    }
    const docs = snap.docs;
    cursor = docs[docs.length - 1];
    if (p === page) {
      return docs.map((x) => mapFirestoreDoc(x));
    }
    if (!cursor) return [];
  }
  return [];
}

async function listLeaderboardMemory(params: {
  metric: SubmitLeaderboardInput['metric'];
  page: number;
  pageSize: number;
}): Promise<ListLeaderboardResult> {
  const pageSize = params.pageSize ?? 20;
  const store = getMetricStore(params.metric);
  const sorted = Array.from(store.values()).sort((a, b) => b.scoreBest - a.scoreBest);
  const start = Math.max(0, params.page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);
  setCachedLeaderboard({
    metric: params.metric,
    page: params.page,
    items,
    cachedAt: new Date().toISOString(),
  });
  return { ok: true, items, fromCache: false };
}

export async function listLeaderboard(params: {
  entitlement: EntitlementState;
  metric: SubmitLeaderboardInput['metric'];
  page: number;
  pageSize?: number;
}): Promise<ListLeaderboardResult> {
  if (shouldBlockFirebase(params.entitlement, 'leaderboard-read')) {
    return { ok: false, reason: 'pro-required' };
  }

  const cached = getCachedLeaderboard({ metric: params.metric, page: params.page });
  if (cached) {
    return { ok: true, items: cached.items, fromCache: true };
  }

  const pageSize = params.pageSize ?? 20;
  const db = getFirestoreDb();

  if (db) {
    try {
      const items = await fetchFirestoreLeaderboardPage(db, params.metric, params.page, pageSize);
      setCachedLeaderboard({
        metric: params.metric,
        page: params.page,
        items,
        cachedAt: new Date().toISOString(),
      });
      return { ok: true, items, fromCache: false };
    } catch {
      return { ok: false, reason: 'unknown' };
    }
  }

  return listLeaderboardMemory({
    metric: params.metric,
    page: params.page,
    pageSize,
  });
}

function commitMemoryLeaderboardBest(
  uid: string,
  input: SubmitLeaderboardInput
): SubmitLeaderboardResult {
  const metricStore = getMetricStore(input.metric);
  const existing = metricStore.get(uid);

  if (existing && input.score <= existing.scoreBest) {
    return { ok: true, reason: 'not-best-score', updated: false };
  }

  const rateLimitStatus = checkUploadRateLimit({
    uid,
    key: `leaderboard:${input.metric}`,
  });
  if (!rateLimitStatus.allowed) {
    return { ok: false, reason: 'rate-limited', updated: false };
  }

  consumeUploadQuota({ uid, key: `leaderboard:${input.metric}` });
  metricStore.set(uid, {
    uid,
    displayName: input.displayName,
    scoreBest: input.score,
    updatedAt: new Date().toISOString(),
    isPro: true,
    ...input.profile,
  });
  clearLeaderboardCache(input.metric);

  return { ok: true, updated: true };
}

async function resolveLeaderboardUid(
  requestedUid: string
): Promise<
  { uid: string; backend: 'firestore' | 'memory' } | { backend: 'error'; reason: 'unknown' }
> {
  const db = getFirestoreDb();
  if (!db) {
    return { uid: requestedUid, backend: 'memory' };
  }

  const currentUser = getCurrentFirebaseUser();
  if (!currentUser || currentUser.isAnonymous) {
    return { backend: 'error', reason: 'unknown' };
  }
  return { uid: currentUser.uid, backend: 'firestore' };
}

export async function submitLeaderboardScore(params: {
  entitlement: EntitlementState;
  input: SubmitLeaderboardInput;
}): Promise<SubmitLeaderboardResult> {
  const { entitlement, input } = params;
  const profileProjection =
    input.profile ?? buildLeaderboardProfileProjection(loadPhysicalProfile()) ?? undefined;
  const normalizedInput: SubmitLeaderboardInput = {
    ...input,
    profile: profileProjection,
  };
  if (shouldBlockFirebase(entitlement, 'leaderboard-write')) {
    return { ok: false, reason: 'pro-required', updated: false };
  }

  if (!validateInput(normalizedInput)) {
    return { ok: false, reason: 'invalid-input', updated: false };
  }

  const resolved = await resolveLeaderboardUid(normalizedInput.uid);
  if (resolved.backend === 'error') {
    return { ok: false, reason: 'unknown', updated: false };
  }

  const uid = resolved.uid;

  const db = getFirestoreDb();

  if (db && resolved.backend === 'firestore') {
    try {
      const ref = doc(
        db,
        LEADERBOARDS_COLLECTION,
        normalizedInput.metric,
        ENTRIES_SUBCOLLECTION,
        uid
      );
      const snap = await getDoc(ref);
      const existingBest = snap.exists()
        ? Number((snap.data() as { scoreBest?: number }).scoreBest ?? NaN)
        : NaN;

      if (Number.isFinite(existingBest) && normalizedInput.score <= existingBest) {
        return { ok: true, reason: 'not-best-score', updated: false };
      }

      const rateLimitStatus = checkUploadRateLimit({
        uid,
        key: `leaderboard:${normalizedInput.metric}`,
      });
      if (!rateLimitStatus.allowed) {
        return { ok: false, reason: 'rate-limited', updated: false };
      }

      await setDoc(
        ref,
        {
          displayName: normalizedInput.displayName,
          scoreBest: normalizedInput.score,
          updatedAt: new Date().toISOString(),
          isPro: true,
          ...normalizedInput.profile,
        },
        { merge: true }
      );

      consumeUploadQuota({ uid, key: `leaderboard:${normalizedInput.metric}` });
      clearLeaderboardCache(normalizedInput.metric);

      return { ok: true, updated: true };
    } catch {
      return { ok: false, reason: 'unknown', updated: false };
    }
  }

  return commitMemoryLeaderboardBest(uid, normalizedInput);
}
