import type { TFunction } from 'i18next';
import hallOfFameMatrix from '../../data/hallOfFameMatrix.json';
import {
  HUMAN_SCALE_DECADE_KEYS,
  translatePopulationClass,
  type HumanScaleDecadeKey,
} from './humanScaleBandResolver';

/** Axes present in the Hall of Fame matrix (assessment pages + overall). */
export type HallOfFameSpectrumAxisId =
  | 'strength'
  | 'explosivePower'
  | 'cardio'
  | 'muscleMass'
  | 'bodyFat'
  | 'gripStrength'
  | 'armSize'
  | 'overall';

export const HALL_OF_FAME_SPECTRUM_AXIS_IDS: readonly HallOfFameSpectrumAxisId[] = [
  'strength',
  'explosivePower',
  'cardio',
  'muscleMass',
  'bodyFat',
  'gripStrength',
  'armSize',
  'overall',
] as const;

export interface HallOfFameMatrixAnchor {
  id: string;
  displayZh: string;
  referenceScore?: number;
}

export interface HallOfFameMatrixEntry {
  decadeKey: string;
  axisId: string;
  anchors: HallOfFameMatrixAnchor[];
}

export interface HallOfFameMatrixDoc {
  version?: string;
  source?: string;
  generatedAt?: string;
  maxDisplayNames?: number;
  entries: HallOfFameMatrixEntry[];
}

export interface AxisHallLadderRow {
  decadeKey: HumanScaleDecadeKey;
  populationClass: string;
  isCurrent: boolean;
  /** Only populated for the current decade when decade >= 60. */
  representativeNames: readonly string[];
}

export interface BuildAxisHallLadderInput {
  axisId: HallOfFameSpectrumAxisId;
  currentDecadeKey: string;
  /** Cap celebrity names on the current rung only. Default 2. */
  maxNamesOnCurrent?: number;
  /** Optional matrix override for tests. */
  matrix?: HallOfFameMatrixDoc;
  /**
   * UI locale for name script preference.
   * WHY: PARITY with Functions `localizeConsultNamePool` — EN drawers drop CJK-only labels when Latin exists.
   */
  locale?: 'zh-Hant' | 'en';
  t: TFunction;
}

/** Decade gate where pantheon celebrity anchors begin (matches Functions resolver). */
export const HALL_OF_FAME_NAME_FLOOR_DECADE = 60;

const BUNDLED_MATRIX = hallOfFameMatrix as HallOfFameMatrixDoc;
let bundledAnchorIndex: Map<string, readonly HallOfFameMatrixAnchor[]> | null = null;

/** Prefer Latin-script labels for EN UI when the cell has any; otherwise keep the full pool. */
export function preferLatinHallNames(
  names: readonly string[],
  locale?: 'zh-Hant' | 'en'
): readonly string[] {
  if (locale !== 'en' || names.length === 0) return names;
  const latin = names.filter((name) => !/[\u4e00-\u9fff]/.test(name));
  return latin.length > 0 ? latin : names;
}

export function getBundledHallOfFameMatrix(): HallOfFameMatrixDoc {
  return BUNDLED_MATRIX;
}

/**
 * Builds `${decadeKey}:${axisId}` → anchors index.
 * WHY: Sparse matrix lookup must stay O(1) for drawer open; never scan all entries in render.
 */
export function buildHallOfFameAnchorIndex(
  matrix: HallOfFameMatrixDoc = getBundledHallOfFameMatrix()
): Map<string, readonly HallOfFameMatrixAnchor[]> {
  if (matrix === BUNDLED_MATRIX) {
    if (!bundledAnchorIndex) {
      bundledAnchorIndex = new Map(
        (matrix.entries ?? []).map((entry) => [
          `${entry.decadeKey}:${entry.axisId}`,
          entry.anchors ?? [],
        ])
      );
    }
    return bundledAnchorIndex;
  }

  return new Map(
    (matrix.entries ?? []).map((entry) => [
      `${entry.decadeKey}:${entry.axisId}`,
      entry.anchors ?? [],
    ])
  );
}

function normalizeDecadeKey(decadeKey: string): HumanScaleDecadeKey {
  if ((HUMAN_SCALE_DECADE_KEYS as readonly string[]).includes(decadeKey)) {
    return decadeKey as HumanScaleDecadeKey;
  }
  return '0';
}

/**
 * Axis ladder for the spectrum drawer.
 * WHY: Only the current rung shows 1–2 celebrity names — other rungs stay label-only to avoid overload.
 * Names are stable `anchors.slice(0, n)` (no shuffle) so reopen does not reshuffle trust.
 * PARITY: Name floor (≥60) matches Functions `resolveHallOfFameDisplayNames`; consult path may shuffle.
 */
export function buildAxisHallLadder(input: BuildAxisHallLadderInput): AxisHallLadderRow[] {
  const {
    axisId,
    currentDecadeKey,
    maxNamesOnCurrent = 2,
    matrix = getBundledHallOfFameMatrix(),
    locale,
    t,
  } = input;

  const current = normalizeDecadeKey(currentDecadeKey);
  const cap = Math.max(0, Math.floor(Number(maxNamesOnCurrent) || 0));
  const index = buildHallOfFameAnchorIndex(matrix);
  const currentDecadeNum = Number(current);

  // WHY: Highest decade first — pantheon at the top reads as ascending aspiration.
  const decades = [...HUMAN_SCALE_DECADE_KEYS].reverse();

  return decades.map((decadeKey) => {
    const isCurrent = decadeKey === current;
    const populationClass = translatePopulationClass(t, decadeKey);
    let representativeNames: readonly string[] = [];

    if (isCurrent && Number.isFinite(currentDecadeNum) && currentDecadeNum >= HALL_OF_FAME_NAME_FLOOR_DECADE) {
      const anchors = index.get(`${decadeKey}:${axisId}`) ?? [];
      const rawNames = anchors
        .map((anchor) => String(anchor.displayZh ?? '').trim())
        .filter(Boolean);
      representativeNames = preferLatinHallNames(rawNames, locale).slice(0, cap);
    }

    return {
      decadeKey,
      populationClass,
      isCurrent,
      representativeNames,
    };
  });
}

/**
 * Prefill prompt when Drawer Dyno CTA fires.
 * WHY: Cold scientific framing matches Boss teaser copy — no pep-talk tone.
 */
export function buildHallSpectrumDecodePrompt(input: {
  axisLabel: string;
  scoreDisplay: string;
  populationClass: string;
  locale?: 'zh-Hant' | 'en';
}): string {
  const axisLabel = String(input.axisLabel ?? '').trim() || '—';
  const scoreDisplay = String(input.scoreDisplay ?? '').trim() || '—';
  const populationClass = String(input.populationClass ?? '').trim() || '—';
  const locale = input.locale === 'en' ? 'en' : 'zh-Hant';

  if (locale === 'en') {
    return `Decode my ${axisLabel} physiological grade with scientific norms — currently ${scoreDisplay} pts (${populationClass}). Drop feelings; locate me on the human-scale norm.`;
  }

  return `用科學常模解碼我的${axisLabel}成色：目前 ${scoreDisplay} 分（${populationClass}）。請拿掉感覺，直面生理常模定位。`;
}
