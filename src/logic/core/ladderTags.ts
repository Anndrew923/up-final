/**
 * Ladder optional-tag helpers — count / prompt eligibility (framework-free).
 */

export type LadderTagsFields = {
  jobCategory?: string | null;
  weeklyTrainingHours?: number | string | null;
  trainingYears?: number | string | null;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  district?: string | null;
};

function hasNonEmptyString(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNumericTag(value: number | string | null | undefined): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n);
  }
  return false;
}

function hasRegionTag(input: LadderTagsFields): boolean {
  const country = (input.countryCode ?? '').trim().toUpperCase();
  if (country === 'TW') {
    return hasNonEmptyString(input.city) || hasNonEmptyString(input.district);
  }
  return hasNonEmptyString(input.region);
}

/**
 * Counts optional ladder segmentation tags (excludes anonymity preference).
 * WHY: Home status pill + prompt eligibility share one definition of "filled".
 */
export function countLadderTags(input: LadderTagsFields): number {
  let count = 0;
  if (hasNonEmptyString(input.jobCategory)) count += 1;
  if (hasNumericTag(input.weeklyTrainingHours)) count += 1;
  if (hasNumericTag(input.trainingYears)) count += 1;
  if (hasNonEmptyString(input.countryCode)) count += 1;
  if (hasRegionTag(input)) count += 1;
  return count;
}

/** True when either high-value ladder tag (job / country) is present. */
export function hasHighValueLadderTags(
  input: Pick<LadderTagsFields, 'jobCategory' | 'countryCode'> | null | undefined
): boolean {
  if (!input) return false;
  return hasNonEmptyString(input.jobCategory) || hasNonEmptyString(input.countryCode);
}

/**
 * Soft prompt when the two highest-value tags are both missing and user has not dismissed.
 * WHY: No local profile → nothing to merge; skip the sheet (caller should finish baseline first).
 * NOTE: Local-only gate — prefer `resolveLadderTagsLocalCloudDecision` when cloud `myEntry` is available.
 */
export function shouldPromptForLadderTags(
  input: Pick<LadderTagsFields, 'jobCategory' | 'countryCode'> | null | undefined,
  dismissed: boolean
): boolean {
  if (dismissed || !input) return false;
  return !hasHighValueLadderTags(input);
}

/** Dual-source soft-prompt outcome after comparing local profile vs cloud myEntry. */
export type LadderTagsLocalCloudDecision = 'prompt' | 'rehydrate' | 'none';

/**
 * Local ↔ cloud decision for ladder tags soft UX.
 * - both empty → prompt
 * - cloud has Job/Country, local empty → silent rehydrate (never prompt)
 * - local already has high-value tags → none (local→cloud sync is a separate path)
 *
 * WHY: New device / cleared storage must not false-trigger「未填寫」when shard already has tags.
 * Dismiss only suppresses prompt — never blocks rehydrate.
 */
export function resolveLadderTagsLocalCloudDecision(
  local: Pick<LadderTagsFields, 'jobCategory' | 'countryCode'> | null | undefined,
  cloud: Pick<LadderTagsFields, 'jobCategory' | 'countryCode'> | null | undefined,
  dismissed: boolean
): LadderTagsLocalCloudDecision {
  if (!local) return 'none';
  if (hasHighValueLadderTags(local)) return 'none';
  if (hasHighValueLadderTags(cloud)) return 'rehydrate';
  if (dismissed) return 'none';
  return 'prompt';
}
