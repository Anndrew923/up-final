/**
 * Health / service terms acceptance — versioned local gate for legal first-line defense.
 * WHY: Version string in the storage key so a future copy bump can re-prompt without migration drama.
 */
export const HEALTH_TERMS_VERSION = 'v1' as const;

export type HealthTermsVersion = typeof HEALTH_TERMS_VERSION | string;

/** localStorage key: `up.termsAccepted.v1` */
export function termsAcceptedStorageKey(version: HealthTermsVersion = HEALTH_TERMS_VERSION): string {
  return `up.termsAccepted.${version}`;
}

export function isTermsAcceptedFlag(raw: string | null | undefined): boolean {
  return raw === '1';
}
