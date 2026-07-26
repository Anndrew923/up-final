/**
 * Hall of Fame matrix loader — Firestore-first with bundled JSON fail-safe.
 *
 * WHY: Ops must update pantheon rosters without redeploying Functions or shipping a new AAB.
 * Callable path awaits loadHallOfFameMatrix(); resolvers stay sync against the in-process cache.
 *
 * Boss ops path: Firestore `dyno_intel_config/hall_of_fame_matrix`
 */
import fallbackMatrixDoc from "./data/hallOfFameMatrix.v1.json" with { type: "json" };
import { db } from "../shared/admin.js";

export const HALL_OF_FAME_MATRIX_COLLECTION = "dyno_intel_config";
export const HALL_OF_FAME_MATRIX_DOC_ID = "hall_of_fame_matrix";
/** In-process TTL — balances Console freshness vs Firestore read cost (5–15 min band). */
export const HALL_OF_FAME_MATRIX_TTL_MS = 10 * 60 * 1000;

/**
 * @typedef {{
 *   version?: string,
 *   maxDisplayNames?: number,
 *   entries?: Array<{ decadeKey: string, axisId: string, anchors?: unknown[] }>,
 *   source?: string,
 *   generatedAt?: string,
 * }} HallOfFameMatrixDoc
 */

function cloneMatrix(doc) {
  return structuredClone(doc);
}

/**
 * @param {unknown} data
 * @returns {data is HallOfFameMatrixDoc}
 */
export function isValidHallOfFameMatrix(data) {
  if (!data || typeof data !== "object") return false;
  const entries = /** @type {HallOfFameMatrixDoc} */ (data).entries;
  if (!Array.isArray(entries) || entries.length === 0) return false;
  return entries.every(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      typeof entry.decadeKey === "string" &&
      typeof entry.axisId === "string" &&
      Array.isArray(entry.anchors)
  );
}

/**
 * @param {HallOfFameMatrixDoc} matrix
 * @returns {Map<string, unknown[]>}
 */
export function buildHallOfFameIndex(matrix) {
  return new Map(
    (matrix.entries ?? []).map((entry) => [`${entry.decadeKey}:${entry.axisId}`, entry.anchors ?? []])
  );
}

/** @type {HallOfFameMatrixDoc} */
let cachedMatrix = cloneMatrix(fallbackMatrixDoc);
/** @type {Map<string, unknown[]>} */
let cachedIndex = buildHallOfFameIndex(cachedMatrix);
/** @type {'fallback' | 'firestore'} */
let cachedSource = "fallback";
let loadedAtMs = 0;
/** @type {Promise<HallOfFameMatrixDoc> | null} */
let inFlight = null;

/** Sync snapshot for resolvers / consult gate (always non-empty after module init). */
export function getHallOfFameMatrix() {
  return cachedMatrix;
}

/** Prebuilt `${decadeKey}:${axisId}` → anchors map (rebuilt on apply). */
export function getHallOfFameIndex() {
  return cachedIndex;
}

export function getHallOfFameMatrixSource() {
  return cachedSource;
}

export function getHallOfFameMaxDisplayNames() {
  const n = Number(cachedMatrix.maxDisplayNames);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

/**
 * @param {HallOfFameMatrixDoc} matrix
 * @param {'fallback' | 'firestore'} source
 */
function applyMatrix(matrix, source) {
  cachedMatrix = cloneMatrix(matrix);
  cachedIndex = buildHallOfFameIndex(cachedMatrix);
  cachedSource = source;
  loadedAtMs = Date.now();
}

function hasUsableCachedEntries() {
  return Array.isArray(cachedMatrix.entries) && cachedMatrix.entries.length > 0;
}

/** Extends TTL without rewriting the snapshot — used when FS blips but last-good is still valid. */
function touchCacheTtl() {
  loadedAtMs = Date.now();
}

/** Test / ops helper — forces next load() to re-fetch. */
export function invalidateHallOfFameMatrixCache() {
  loadedAtMs = 0;
  inFlight = null;
}

/** Restores bundled JSON without hitting Firestore (unit tests). */
export function resetHallOfFameMatrixToFallback() {
  applyMatrix(fallbackMatrixDoc, "fallback");
  inFlight = null;
}

async function fetchMatrixFromFirestore() {
  const snap = await db
    .collection(HALL_OF_FAME_MATRIX_COLLECTION)
    .doc(HALL_OF_FAME_MATRIX_DOC_ID)
    .get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!isValidHallOfFameMatrix(data)) return null;
  return /** @type {HallOfFameMatrixDoc} */ (data);
}

/**
 * Prefer Firestore; on miss use bundled JSON; on transport error keep last-good when possible.
 * TTL suppresses repeat reads within HALL_OF_FAME_MATRIX_TTL_MS.
 * @returns {Promise<HallOfFameMatrixDoc>}
 */
export async function loadHallOfFameMatrix() {
  const now = Date.now();
  if (loadedAtMs > 0 && now - loadedAtMs < HALL_OF_FAME_MATRIX_TTL_MS) {
    return cachedMatrix;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const remote = await fetchMatrixFromFirestore();
      if (remote) {
        applyMatrix(remote, "firestore");
        return cachedMatrix;
      }
      // Doc missing / invalid schema → explicit fail-safe JSON (ops may have cleared the doc).
      applyMatrix(fallbackMatrixDoc, "fallback");
      return cachedMatrix;
    } catch (err) {
      console.warn(
        "[hallOfFameMatrix] Firestore load failed; keeping last-good or bundled fallback",
        err?.message ?? err
      );
      // WHY: Transient Admin SDK / network errors must not wipe a warm Firestore snapshot mid-TTL miss.
      if (hasUsableCachedEntries()) {
        touchCacheTtl();
        return cachedMatrix;
      }
      applyMatrix(fallbackMatrixDoc, "fallback");
      return cachedMatrix;
    }
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}
