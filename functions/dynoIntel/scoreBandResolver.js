/**
 * v3.0 — Score band resolver (Functions mirror of client scoreMeaningCatalog).
 * WHY: Human briefs resolve by band id without importing client TS into Cloud Functions.
 * v3.5.1 — soul stream / gender routing for four-track praise matrix.
 */

const NEURO_SOUL_AXES = new Set(["strength", "explosivePower", "gripStrength"]);

const VOLUME_SOUL_AXES = new Set([
  "muscleMass",
  "bodyFat",
  "armSize",
  "cardio",
  "cooper",
  "5km",
  "overall",
]);

export const SOUL_STREAM_NEURO = "neuro";
export const SOUL_STREAM_VOLUME = "volume";

/** @typedef {"neuro" | "volume"} SoulStream */
/** @typedef {"male" | "female"} SoulGenderTrack */

/**
 * v3.5.1 — axis camp router: neuro recruitment vs volume/time accumulation.
 * @param {string} axis
 * @returns {SoulStream}
 */
export function resolveSoulStream(axis) {
  if (NEURO_SOUL_AXES.has(axis)) return SOUL_STREAM_NEURO;
  if (VOLUME_SOUL_AXES.has(axis)) return SOUL_STREAM_VOLUME;
  return SOUL_STREAM_VOLUME;
}

/**
 * v3.5.1 — profile gender with male default when missing (0-crash guard).
 * @param {{ gender?: string | null } | null | undefined} profile
 * @returns {SoulGenderTrack}
 */
export function resolveSoulGenderTrack(profile) {
  return profile?.gender === "female" ? "female" : "male";
}

/**
 * v3.5.1 — matrix field key for zh-Hant four-track soul praise slot.
 * @param {SoulStream} stream
 * @param {SoulGenderTrack} genderTrack
 * @returns {"neuro_male" | "neuro_female" | "volume_male" | "volume_female"}
 */
export function resolveSoulMatrixFieldKey(stream, genderTrack) {
  return `${stream}_${genderTrack}`;
}

const DECADE_AXIS_TIER_BANDS = [
  { id: "BASE", min: 0, max: 39.99 },
  { id: "TIER_40", min: 40, max: 49.99 },
  { id: "TIER_50", min: 50, max: 59.99 },
  { id: "TIER_60", min: 60, max: 69.99 },
  { id: "TIER_70", min: 70, max: 79.99 },
  { id: "TIER_80", min: 80, max: 89.99 },
  { id: "TIER_90", min: 90, max: 99.99 },
  { id: "TIER_100", min: 100, max: 109.99 },
  { id: "TIER_110", min: 110, max: 119.99 },
  { id: "TIER_120", min: 120, max: 129.99 },
  { id: "TIER_130", min: 130, max: 139.99 },
  { id: "TIER_140", min: 140, max: 149.99 },
  { id: "LEGEND", min: 150, max: 179.99 },
  { id: "PANTHEON", min: 180, max: 999 },
];

const DECADE_GRIP_TIER_BANDS = [
  ...DECADE_AXIS_TIER_BANDS.slice(0, 12),
  { id: "TIER_150", min: 150, max: 159.99 },
  { id: "TIER_160", min: 160, max: 169.99 },
  { id: "TIER_170", min: 170, max: 179.99 },
  { id: "PANTHEON", min: 180, max: 999 },
];

const SCORE_MEANING_CATALOG = {
  strength: DECADE_AXIS_TIER_BANDS,
  explosivePower: DECADE_AXIS_TIER_BANDS,
  cardio: DECADE_AXIS_TIER_BANDS,
  muscleMass: DECADE_AXIS_TIER_BANDS,
  bodyFat: DECADE_AXIS_TIER_BANDS,
  gripStrength: DECADE_GRIP_TIER_BANDS,
  armSize: DECADE_AXIS_TIER_BANDS,
  cooper: DECADE_AXIS_TIER_BANDS,
  "5km": DECADE_AXIS_TIER_BANDS,
};

function normalizeScore(score) {
  if (!Number.isFinite(Number(score))) return 0;
  return Math.max(0, Number(score));
}

export function resolveScoreBandFromBands(bands, score) {
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  const safe = normalizeScore(score);
  if (sorted.length === 0) return { id: "BASE", min: 0, max: Number.POSITIVE_INFINITY };

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (safe < next.min) return current;
  }
  return sorted[sorted.length - 1];
}

export function resolveScoreBandId(metric, score) {
  const bands = SCORE_MEANING_CATALOG[metric] ?? DECADE_AXIS_TIER_BANDS;
  return resolveScoreBandFromBands(bands, score).id;
}

/**
 * v3.3.2 — Maps resolver tierId to human-scale matrix decade key.
 * WHY: BASE/PANTHEON/grip 150+ must never miss the population matrix lookup.
 */
export function resolveHumanScaleDecadeKey(tierId) {
  if (tierId === "BASE") return "0";
  if (tierId === "LEGEND" || tierId === "PANTHEON") return "150";
  if (/^TIER_1[567]0$/.test(tierId)) return "150";
  const match = /^TIER_(\d+)$/.exec(tierId);
  if (!match) return "0";
  const decade = Math.floor(Number(match[1]) / 10) * 10;
  return String(Math.max(0, Math.min(150, decade)));
}
