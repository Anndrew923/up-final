/**
 * Maps profile / form gender strings to norm-table sex for age-based standards
 * (cardio Cooper, muscle SMM, explosive power). Matches reference-app `normalizeGender`
 * in `assessmentScoring.js`.
 */
export function normalizeGenderForNormTables(
  gender: string | null | undefined
): 'male' | 'female' | null {
  if (!gender) return null;
  const g = `${gender}`.toLowerCase();
  if (g === 'male' || gender === '男性') return 'male';
  if (g === 'female' || gender === '女性') return 'female';
  if (g.includes('m')) return 'male';
  return 'female';
}
