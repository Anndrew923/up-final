/**
 * v5.5 — Decade skeleton + synced praise weld (single source of truth).
 * DESIGN INTENT: Matrix only stores structural keys (decadeKey / tierId / scoreRange).
 * All populationClass + overall/neuro/volume copy comes from dynoIntelHumanPraise.data.js
 * after `npm run dyno:sync-human-praise` — zero dual-track copy maintenance.
 */

import {
  DYNO_INTEL_HUMAN_PRAISE_BY_DECADE,
  DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN,
} from "./dynoIntelHumanPraise.data.js";

function resolvePraiseByDecade(locale, decadeKey) {
  if (locale === "en") {
    return (
      DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN[decadeKey] ??
      DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN["0"] ??
      null
    );
  }
  return DYNO_INTEL_HUMAN_PRAISE_BY_DECADE[decadeKey] ?? DYNO_INTEL_HUMAN_PRAISE_BY_DECADE["0"] ?? null;
}

/**
 * Weld synced praise slots onto a decade skeleton row.
 * WHY: Structural metadata stays local; prose never forks from i18n sync.
 */
function scaleBucket({ decadeKey, tierId, scoreRange, locale = "zh-Hant" }) {
  const praise = resolvePraiseByDecade(locale, decadeKey);
  const overall = String(praise?.overall ?? "").trim();
  const neuro = String(praise?.neuro ?? "").trim();
  const volume = String(praise?.volume ?? "").trim();
  return {
    tierId,
    scoreRange,
    populationClass: String(praise?.populationClass ?? "").trim(),
    summaryHuman: overall,
    overall,
    neuro_male: neuro,
    neuro_female: neuro,
    volume_male: volume,
    volume_female: volume,
  };
}

const scaleBucketEn = (row) => scaleBucket({ ...row, locale: "en" });

/** Structural decade skeleton — shared by zh-Hant / en weld paths. */
const DECADE_SKELETON = [
  { decadeKey: "150", tierId: "LEGEND", scoreRange: "150+" },
  { decadeKey: "140", tierId: "TIER_140", scoreRange: "140–149" },
  { decadeKey: "130", tierId: "TIER_130", scoreRange: "130–139" },
  { decadeKey: "120", tierId: "TIER_120", scoreRange: "120–129" },
  { decadeKey: "110", tierId: "TIER_110", scoreRange: "110–119" },
  { decadeKey: "100", tierId: "TIER_100", scoreRange: "100–109" },
  { decadeKey: "90", tierId: "TIER_90", scoreRange: "90–99" },
  { decadeKey: "80", tierId: "TIER_80", scoreRange: "80–89" },
  { decadeKey: "70", tierId: "TIER_70", scoreRange: "70–79" },
  { decadeKey: "60", tierId: "TIER_60", scoreRange: "60–69" },
  { decadeKey: "50", tierId: "TIER_50", scoreRange: "50–59" },
  { decadeKey: "40", tierId: "TIER_40", scoreRange: "40–49" },
  { decadeKey: "0", tierId: "BASE", scoreRange: "0–39" },
];

function buildMatrix(weld) {
  /** @type {Record<string, ReturnType<typeof scaleBucket>>} */
  const matrix = {};
  for (const row of DECADE_SKELETON) {
    matrix[row.decadeKey] = weld(row);
  }
  return matrix;
}

export const DYNO_INTEL_HUMAN_SCALE_MATRIX_ZH = buildMatrix(scaleBucket);
export const DYNO_INTEL_HUMAN_SCALE_MATRIX_EN = buildMatrix(scaleBucketEn);
