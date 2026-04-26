import {
  collection,
  getCountFromServer,
  getDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { shouldBlockFirebase } from '../logic/core/entitlement';
import { isValidLeaderboardShardId, type LeaderboardShardId } from '../logic/core/ladderShards';
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
import {
  getLeaderboardIdentityPayload,
  normalizeLadderDisplayName,
  sanitizeAvatarUrlForLeaderboard,
} from './ladderIdentityService';
import { loadPhysicalProfile } from './localStorageService';
import { ENTRIES_SUBCOLLECTION, LEADERBOARDS_COLLECTION } from './firestorePaths';
import { checkUploadRateLimit, consumeUploadQuota, LEADERBOARD_UPLOADS_PER_HOUR } from './rateLimitService';
import {
  clearLeaderboardCache,
  getCachedLeaderboard,
  setCachedLeaderboard,
  type LeaderboardEntry,
} from './leaderboardCacheService';

/** Re-export for callers that only import from `leaderboardService`. */
export type { LeaderboardShardId };

export interface SubmitLeaderboardInput {
  uid: string;
  /** Firestore segment `leaderboards/{metric}/entries` — see `logic/core/ladderShards.ts`. */
  metric: LeaderboardShardId;
  score: number;
  displayName: string;
  avatarUrl?: string;
  profile?: Partial<LadderProfileProjection>;
}

export interface SubmitLeaderboardResult {
  ok: boolean;
  reason?: 'pro-required' | 'rate-limited' | 'invalid-input' | 'unknown';
  updated?: boolean;
  /**
   * Prior `scoreBest` when known (in-memory mock / dev). Firestore path skips pre-read — always `null` on success.
   */
  previousScore?: number | null;
  /** Score written to the ladder row (`scoreBest` field in Firestore). */
  submittedScore?: number | null;
  /** When `previousScore` is known: new value is strictly higher. */
  improved?: boolean;
  /** After a successful write or a rate-limit denial — rolling hourly cap per shard. */
  rateLimitRemaining?: number;
  rateLimitResetAt?: string;
  limitPerHour?: number;
}

export interface ListLeaderboardResult {
  ok: boolean;
  reason?: 'pro-required' | 'unknown';
  items?: LeaderboardEntry[];
  fromCache?: boolean;
}

export interface GetMyLeaderboardEntryResult {
  ok: boolean;
  reason?: 'pro-required' | 'unknown';
  item?: LeaderboardEntry | null;
}

export interface GetRankByScoreBestResult {
  ok: boolean;
  reason?: 'pro-required' | 'unknown';
  rank?: number | null;
  fromCache?: boolean;
}

const memoryDb = new Map<string, Map<string, LeaderboardEntry>>();
const GLOBAL_RANK_CACHE_TTL_MS = 30_000;
const globalRankCacheMemory = new Map<string, { rank: number; cachedAt: number }>();

function buildGlobalRankCacheKey(uid: string, metric: LeaderboardShardId, scoreBest: number): string {
  return `${uid}::${metric}::${scoreBest}`;
}

function readGlobalRankCache(key: string): number | null {
  const now = Date.now();
  const memoryCached = globalRankCacheMemory.get(key);
  if (memoryCached && now - memoryCached.cachedAt < GLOBAL_RANK_CACHE_TTL_MS) {
    return memoryCached.rank;
  }
  if (memoryCached) {
    globalRankCacheMemory.delete(key);
  }
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(`leaderboard:global-rank:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { rank?: number; cachedAt?: number };
    if (
      typeof parsed.rank === 'number' &&
      Number.isFinite(parsed.rank) &&
      typeof parsed.cachedAt === 'number' &&
      now - parsed.cachedAt < GLOBAL_RANK_CACHE_TTL_MS
    ) {
      globalRankCacheMemory.set(key, { rank: parsed.rank, cachedAt: parsed.cachedAt });
      return parsed.rank;
    }
    window.sessionStorage.removeItem(`leaderboard:global-rank:${key}`);
    return null;
  } catch {
    return null;
  }
}

function writeGlobalRankCache(key: string, rank: number): void {
  const payload = { rank, cachedAt: Date.now() };
  globalRankCacheMemory.set(key, payload);
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(`leaderboard:global-rank:${key}`, JSON.stringify(payload));
  } catch {
    // Ignore cache write failures.
  }
}

function getMetricStore(metric: LeaderboardShardId): Map<string, LeaderboardEntry> {
  const existing = memoryDb.get(metric);
  if (existing) return existing;
  const created = new Map<string, LeaderboardEntry>();
  memoryDb.set(metric, created);
  return created;
}

function validateInput(input: SubmitLeaderboardInput): boolean {
  return (
    Boolean(input.uid && input.displayName) &&
    Number.isFinite(input.score) &&
    input.score >= 0 &&
    isValidLeaderboardShardId(input.metric)
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
    displayRaw:
      typeof data.displayRaw === 'number' && Number.isFinite(data.displayRaw) ? data.displayRaw : undefined,
    displayRawUnit:
      typeof data.displayRawUnit === 'string' && data.displayRawUnit.trim().length > 0
        ? data.displayRawUnit.trim()
        : undefined,
    avatarUrl: typeof data.avatarUrl === 'string' && data.avatarUrl.length > 0 ? data.avatarUrl : undefined,
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

function withRank(entries: LeaderboardEntry[], offset = 0): LeaderboardEntry[] {
  return entries.map((item, index) => ({ ...item, rank: offset + index + 1 }));
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
      const offset = (page - 1) * pageSize;
      return withRank(docs.map((x) => mapFirestoreDoc(x)), offset);
    }
    if (!cursor) return [];
  }
  return [];
}

async function listLeaderboardMemory(params: {
  metric: LeaderboardShardId;
  page: number;
  pageSize: number;
}): Promise<ListLeaderboardResult> {
  const pageSize = params.pageSize ?? 20;
  const store = getMetricStore(params.metric);
  const sorted = Array.from(store.values()).sort((a, b) => b.scoreBest - a.scoreBest);
  const start = Math.max(0, params.page - 1) * pageSize;
  const items = withRank(sorted.slice(start, start + pageSize), start);
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
  metric: LeaderboardShardId;
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
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[leaderboard] listLeaderboard Firestore error', err);
      }
      return { ok: false, reason: 'unknown' };
    }
  }

  return listLeaderboardMemory({
    metric: params.metric,
    page: params.page,
    pageSize,
  });
}

export async function getMyLeaderboardEntry(params: {
  entitlement: EntitlementState;
  metric: LeaderboardShardId;
  uid: string;
}): Promise<GetMyLeaderboardEntryResult> {
  if (shouldBlockFirebase(params.entitlement, 'leaderboard-read')) {
    return { ok: false, reason: 'pro-required' };
  }
  if (!params.uid) {
    return { ok: true, item: null };
  }

  const db = getFirestoreDb();
  if (db) {
    try {
      const ref = doc(db, LEADERBOARDS_COLLECTION, params.metric, ENTRIES_SUBCOLLECTION, params.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        return { ok: true, item: null };
      }
      return { ok: true, item: mapFirestoreDoc(snap) };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[leaderboard] getMyLeaderboardEntry Firestore error', err);
      }
      return { ok: false, reason: 'unknown' };
    }
  }

  const store = getMetricStore(params.metric);
  return { ok: true, item: store.get(params.uid) ?? null };
}

export async function getRankByScoreBest(params: {
  entitlement: EntitlementState;
  metric: LeaderboardShardId;
  uid: string;
  scoreBest: number;
}): Promise<GetRankByScoreBestResult> {
  if (shouldBlockFirebase(params.entitlement, 'leaderboard-read')) {
    return { ok: false, reason: 'pro-required' };
  }
  if (!Number.isFinite(params.scoreBest) || params.scoreBest <= 0) {
    return { ok: true, rank: null, fromCache: false };
  }

  const cacheKey = buildGlobalRankCacheKey(params.uid, params.metric, params.scoreBest);
  const cachedRank = readGlobalRankCache(cacheKey);
  if (cachedRank !== null) {
    return { ok: true, rank: cachedRank, fromCache: true };
  }

  const db = getFirestoreDb();
  if (db) {
    try {
      const base = entriesCollection(db, params.metric);
      const countQuery = query(base, where('scoreBest', '>', params.scoreBest));
      const snap = await getCountFromServer(countQuery);
      const rank = snap.data().count + 1;
      writeGlobalRankCache(cacheKey, rank);
      return { ok: true, rank, fromCache: false };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[leaderboard] getRankByScoreBest Firestore error', err);
      }
      return { ok: false, reason: 'unknown' };
    }
  }

  const store = getMetricStore(params.metric);
  const rank =
    Array.from(store.values()).filter((row) => Number.isFinite(row.scoreBest) && row.scoreBest > params.scoreBest).length + 1;
  writeGlobalRankCache(cacheKey, rank);
  return { ok: true, rank, fromCache: false };
}

function applyMemoryLeaderboardSubmit(
  uid: string,
  input: SubmitLeaderboardInput
): SubmitLeaderboardResult {
  const metricStore = getMetricStore(input.metric);
  const existing = metricStore.get(uid);
  const rateKey = `leaderboard:${input.metric}`;

  const rateLimitStatus = checkUploadRateLimit({
    uid,
    key: rateKey,
  });
  if (!rateLimitStatus.allowed) {
    return {
      ok: false,
      reason: 'rate-limited',
      updated: false,
      previousScore: existing?.scoreBest ?? null,
      submittedScore: existing?.scoreBest ?? null,
      improved: false,
      rateLimitRemaining: rateLimitStatus.remaining,
      rateLimitResetAt: rateLimitStatus.resetAt,
      limitPerHour: LEADERBOARD_UPLOADS_PER_HOUR,
    };
  }

  const afterConsume = consumeUploadQuota({ uid, key: rateKey });
  const isAnonymousInLadder = input.profile?.isAnonymousInLadder === true;
  const row: LeaderboardEntry = {
    uid,
    displayName: isAnonymousInLadder ? 'Anonymous' : input.displayName,
    scoreBest: input.score,
    updatedAt: new Date().toISOString(),
    isPro: true,
    ...input.profile,
  };
  if (!isAnonymousInLadder) {
    const safeAvatar = sanitizeAvatarUrlForLeaderboard(input.avatarUrl);
    if (safeAvatar) row.avatarUrl = safeAvatar;
    else delete row.avatarUrl;
  } else {
    delete row.avatarUrl;
  }
  metricStore.set(uid, row);
  clearLeaderboardCache(input.metric);

  return {
    ok: true,
    updated: true,
    previousScore: existing?.scoreBest ?? null,
    submittedScore: input.score,
    improved: existing ? input.score > existing.scoreBest : true,
    rateLimitRemaining: afterConsume.remaining,
    rateLimitResetAt: afterConsume.resetAt,
    limitPerHour: LEADERBOARD_UPLOADS_PER_HOUR,
  };
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
    return { ok: false, reason: 'pro-required', updated: false, previousScore: null, submittedScore: null };
  }

  const identity = getLeaderboardIdentityPayload();
  const mergedForWrite: SubmitLeaderboardInput = {
    ...normalizedInput,
    displayName: normalizeLadderDisplayName(
      (normalizedInput.displayName && normalizedInput.displayName.trim()) || identity.displayName || ''
    ),
    avatarUrl: sanitizeAvatarUrlForLeaderboard(normalizedInput.avatarUrl ?? identity.avatarUrl),
  };

  if (!validateInput(mergedForWrite)) {
    return { ok: false, reason: 'invalid-input', updated: false, previousScore: null, submittedScore: null };
  }

  const resolved = await resolveLeaderboardUid(mergedForWrite.uid);
  if (resolved.backend === 'error') {
    return { ok: false, reason: 'unknown', updated: false, previousScore: null, submittedScore: null };
  }

  const uid = resolved.uid;

  const db = getFirestoreDb();

  if (db && resolved.backend === 'firestore') {
    try {
      const ref = doc(
        db,
        LEADERBOARDS_COLLECTION,
        mergedForWrite.metric,
        ENTRIES_SUBCOLLECTION,
        uid
      );
      const rateKey = `leaderboard:${mergedForWrite.metric}`;

      const rateLimitStatus = checkUploadRateLimit({
        uid,
        key: rateKey,
      });
      if (!rateLimitStatus.allowed) {
        return {
          ok: false,
          reason: 'rate-limited',
          updated: false,
          previousScore: null,
          submittedScore: null,
          rateLimitRemaining: rateLimitStatus.remaining,
          rateLimitResetAt: rateLimitStatus.resetAt,
          limitPerHour: LEADERBOARD_UPLOADS_PER_HOUR,
        };
      }

      const payload: Record<string, unknown> = {
        displayName: mergedForWrite.profile?.isAnonymousInLadder === true ? 'Anonymous' : mergedForWrite.displayName,
        scoreBest: mergedForWrite.score,
        updatedAt: new Date().toISOString(),
        isPro: true,
        ...mergedForWrite.profile,
        avatarUrl:
          mergedForWrite.profile?.isAnonymousInLadder === true
            ? deleteField()
            : mergedForWrite.avatarUrl
              ? mergedForWrite.avatarUrl
              : deleteField(),
        displayRaw: deleteField(),
        displayRawUnit: deleteField(),
      };

      await setDoc(ref, payload, { merge: true });

      const afterConsume = consumeUploadQuota({ uid, key: rateKey });
      clearLeaderboardCache(mergedForWrite.metric);

      return {
        ok: true,
        updated: true,
        previousScore: null,
        submittedScore: mergedForWrite.score,
        rateLimitRemaining: afterConsume.remaining,
        rateLimitResetAt: afterConsume.resetAt,
        limitPerHour: LEADERBOARD_UPLOADS_PER_HOUR,
      };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[leaderboard] submitLeaderboardScore Firestore error', err);
      }
      return { ok: false, reason: 'unknown', updated: false, previousScore: null, submittedScore: null };
    }
  }

  return applyMemoryLeaderboardSubmit(uid, mergedForWrite);
}
