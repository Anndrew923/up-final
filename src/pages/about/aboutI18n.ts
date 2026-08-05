export type AdvisorProfile = {
  name: string;
  role: string;
  subtitle?: string;
  bio: string;
  highlights: string[];
  closing: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** WHY: i18n `returnObjects` can return a string fallback — normalize to a clean bullet list. */
export function readStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isNonEmptyString).map((item) => item.trim());
}

function isAdvisorProfile(value: unknown): value is AdvisorProfile {
  if (value == null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (
    !isNonEmptyString(record.name) ||
    !isNonEmptyString(record.role) ||
    !isNonEmptyString(record.bio) ||
    !isNonEmptyString(record.closing) ||
    !Array.isArray(record.highlights) ||
    record.highlights.length === 0
  ) {
    return false;
  }
  if (record.subtitle != null && typeof record.subtitle !== 'string') return false;
  return record.highlights.every(isNonEmptyString);
}

/**
 * WHY: i18n `returnObjects` can drift (string fallback / partial objects).
 * Normalize here so UI never renders half-broken advisor cards.
 */
export function readAdvisorProfiles(raw: unknown): AdvisorProfile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isAdvisorProfile)
    .map((advisor) => {
      const subtitle = advisor.subtitle?.trim();
      const highlights = readStringList(advisor.highlights);
      return {
        name: advisor.name.trim(),
        role: advisor.role.trim(),
        bio: advisor.bio.trim(),
        closing: advisor.closing.trim(),
        highlights,
        ...(subtitle ? { subtitle } : {}),
      };
    })
    .filter((advisor) => advisor.highlights.length > 0);
}
