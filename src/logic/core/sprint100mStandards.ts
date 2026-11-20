/**
 * 100 m sprint — world-record driven single source of truth (SSOT).
 *
 * WHY: Hand-written T100 tables drifted from real age-group WR physics and forced a second
 * T100 mirror in explosiveInputCaps (circular-import risk). All score anchors and input floors
 * derive from `SPRINT_100M_WR_SECONDS` so powerScoring + caps share one table.
 *
 * Offsets (locked by quartic overflow contract):
 * - T100 = WR + 1.42 → input WR ⇒ raw 177.19
 * - T50 / T0 = T100 + 3 / + 6 (linear band spacing)
 * - floor = WR − 0.13 → input ≤ floor ⇒ raw ≈ 200.26 → clamp 200
 */
import { getPowerAgeRange, type PowerAgeBucket } from './powerAgeRange';

/** Sprint score anchors (seconds): lower is better. Compatible with PowerStandardRow. */
export type SprintStandardRow = Readonly<Record<0 | 50 | 100, number>>;

/** Δt from WR → T100 so quartic overflow lands on 177.19. */
export const SPRINT_WR_TO_T100_OFFSET_SECONDS = 1.42 as const;
/** Linear mid-band span T100 → T50. */
export const SPRINT_T100_TO_T50_OFFSET_SECONDS = 3 as const;
/** Linear low-band span T100 → T0 (= T50 + 3). */
export const SPRINT_T100_TO_T0_OFFSET_SECONDS = 6 as const;
/** Fastest accepted time vs WR; faster inputs floor here (≈200 raw before clamp). */
export const SPRINT_WR_TO_FLOOR_OFFSET_SECONDS = 0.13 as const;

/**
 * Age-group 100 m world-record anchors (seconds).
 * `12-15` / `16-20` share the ≤20 WR band.
 */
export const SPRINT_100M_WR_SECONDS: Readonly<
  Record<'male' | 'female', Readonly<Record<PowerAgeBucket, number>>>
> = {
  male: {
    '12-15': 9.89,
    '16-20': 9.89,
    '21-30': 9.58,
    '31-40': 9.87,
    '41-50': 9.93,
    '51-60': 10.88,
    '61-70': 11.7,
    '71-80': 12.77,
  },
  female: {
    '12-15': 10.75,
    '16-20': 10.75,
    '21-30': 10.49,
    '31-40': 10.62,
    '41-50': 10.99,
    '51-60': 11.67,
    '61-70': 13.2,
    '71-80': 14.73,
  },
};

const round2Fixed = (n: number) => Number(n.toFixed(2));

/** Derive 0 / 50 / 100 second anchors from a WR time. */
export function deriveSprintStandardRowFromWr(wrSeconds: number): SprintStandardRow {
  const t100 = round2Fixed(wrSeconds + SPRINT_WR_TO_T100_OFFSET_SECONDS);
  const t50 = round2Fixed(t100 + SPRINT_T100_TO_T50_OFFSET_SECONDS);
  const t0 = round2Fixed(t100 + SPRINT_T100_TO_T0_OFFSET_SECONDS);
  return { 0: t0, 50: t50, 100: t100 };
}

/** Physical input floor for a WR (seconds). */
export function deriveSprintFloorSecondsFromWr(wrSeconds: number): number {
  return round2Fixed(wrSeconds - SPRINT_WR_TO_FLOOR_OFFSET_SECONDS);
}

function buildSprintStandards(
  gender: 'male' | 'female'
): Readonly<Record<PowerAgeBucket, SprintStandardRow>> {
  const wrMap = SPRINT_100M_WR_SECONDS[gender];
  const out = {} as Record<PowerAgeBucket, SprintStandardRow>;
  for (const bucket of Object.keys(wrMap) as PowerAgeBucket[]) {
    out[bucket] = deriveSprintStandardRowFromWr(wrMap[bucket]);
  }
  return out;
}

export const SPRINT_STANDARDS_MALE: Readonly<Record<PowerAgeBucket, SprintStandardRow>> =
  buildSprintStandards('male');

export const SPRINT_STANDARDS_FEMALE: Readonly<Record<PowerAgeBucket, SprintStandardRow>> =
  buildSprintStandards('female');

export function getSprint100mWrSeconds(
  gender: 'male' | 'female',
  age?: number | string | null
): number | null {
  const bucket = getPowerAgeRange(age);
  if (!bucket) return null;
  return SPRINT_100M_WR_SECONDS[gender][bucket];
}

/**
 * Age/sex 100 m floor. Missing/out-of-range age falls back to 21–30 (absolute sex WR band).
 */
export function getSprint100mFloorSeconds(
  gender: 'male' | 'female',
  age?: number | string | null
): number {
  const bucket = getPowerAgeRange(age) ?? '21-30';
  return deriveSprintFloorSecondsFromWr(SPRINT_100M_WR_SECONDS[gender][bucket]);
}

export function getSprint100mStandardRow(
  gender: 'male' | 'female',
  age?: number | string | null
): SprintStandardRow | null {
  const bucket = getPowerAgeRange(age);
  if (!bucket) return null;
  return gender === 'male' ? SPRINT_STANDARDS_MALE[bucket] : SPRINT_STANDARDS_FEMALE[bucket];
}
