/**
 * Shared explosive / power age buckets (12–80).
 * WHY: Keep floor caps and norm-table lookup on one age function — avoids drift between
 * `explosiveInputCaps` and `powerScoring` (circular-import safe; no caps/scoring deps).
 */

export type PowerAgeBucket =
  | '12-15'
  | '16-20'
  | '21-30'
  | '31-40'
  | '41-50'
  | '51-60'
  | '61-70'
  | '71-80';

/**
 * Age buckets match reference-app power tables (12–80). Profile in this app starts at 13;
 * ages 13–15 use the `12-15` row. Above 80 → null (no table).
 */
export function getPowerAgeRange(age: number | string | null | undefined): PowerAgeBucket | null {
  const a = parseInt(String(age), 10);
  if (!a || a <= 0) return null;
  if (a >= 12 && a <= 15) return '12-15';
  if (a >= 16 && a <= 20) return '16-20';
  if (a >= 21 && a <= 30) return '21-30';
  if (a >= 31 && a <= 40) return '31-40';
  if (a >= 41 && a <= 50) return '41-50';
  if (a >= 51 && a <= 60) return '51-60';
  if (a >= 61 && a <= 70) return '61-70';
  if (a >= 71 && a <= 80) return '71-80';
  return null;
}
