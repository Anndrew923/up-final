import type { TFunction } from 'i18next';

const BASELINE_SECTION_KEY = 'onboarding.baseline';

/** Onboarding display order for the six radar axes (not Codex tab order). */
export const ONBOARDING_BASELINE_FEATURE_KEYS = [
  'strength',
  'cardio',
  'skeletalMuscle',
  'ffmi',
  'explosive',
  'grip',
] as const;

export type OnboardingBaselineFeatureKey = (typeof ONBOARDING_BASELINE_FEATURE_KEYS)[number];

export interface OnboardingBaselineFeatureCopy {
  label: string;
  desc: string;
}

export interface OnboardingBaselineCopy {
  protocolTitle: string;
  protocolDesc: string;
  authorityFooter: string;
  features: Record<OnboardingBaselineFeatureKey, OnboardingBaselineFeatureCopy>;
}

function pickString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveLeaf(t: TFunction, dottedKey: string): string {
  const direct = t(dottedKey, { ns: 'common' });
  return direct !== dottedKey ? pickString(direct) : '';
}

function readBaselineField(
  t: TFunction,
  section: Record<string, unknown> | null,
  field: string
): string {
  const fromSection = section ? pickString(section[field]) : '';
  if (fromSection.length > 0) return fromSection;
  return resolveLeaf(t, `${BASELINE_SECTION_KEY}.${field}`);
}

function resolveFeatureCopy(
  t: TFunction,
  key: OnboardingBaselineFeatureKey,
  raw: unknown
): OnboardingBaselineFeatureCopy {
  const featureKey = `${BASELINE_SECTION_KEY}.features.${key}`;
  if (typeof raw === 'object' && raw !== null) {
    const row = raw as Record<string, unknown>;
    const label = pickString(row.label);
    const desc = pickString(row.desc);
    if (label.length > 0 || desc.length > 0) {
      return {
        label: label.length > 0 ? label : resolveLeaf(t, `${featureKey}.label`),
        desc: desc.length > 0 ? desc : resolveLeaf(t, `${featureKey}.desc`),
      };
    }
  }

  return {
    label: resolveLeaf(t, `${featureKey}.label`),
    desc: resolveLeaf(t, `${featureKey}.desc`),
  };
}

/** Locale-aware brackets for feature labels (zh uses full-width book title marks). */
export function formatOnboardingBaselineFeatureLabel(label: string, language: string): string {
  if (!label) return '';
  const useCjkBrackets = language === 'zh-Hant' || language.startsWith('zh');
  return useCjkBrackets ? `【${label}】` : `[${label}]`;
}

/**
 * Resolves `onboarding.baseline` copy from the common bundle.
 * WHY: Deep dotted keys (`onboarding.baseline.features.*`) can surface as raw key paths after
 * Vite locale HMR or partial bundle merges — same resilience pattern as `resolveHomeBundleCopy`.
 */
export function resolveOnboardingBaselineCopy(t: TFunction): OnboardingBaselineCopy {
  const baseline: unknown = t(BASELINE_SECTION_KEY, { returnObjects: true, ns: 'common' });

  const section =
    typeof baseline === 'object' && baseline !== null ? (baseline as Record<string, unknown>) : null;

  const featuresObj =
    section?.features != null && typeof section.features === 'object'
      ? (section.features as Record<string, unknown>)
      : null;

  const features = {} as Record<OnboardingBaselineFeatureKey, OnboardingBaselineFeatureCopy>;
  for (const key of ONBOARDING_BASELINE_FEATURE_KEYS) {
    features[key] = resolveFeatureCopy(t, key, featuresObj?.[key]);
  }

  return {
    protocolTitle: readBaselineField(t, section, 'protocolTitle'),
    protocolDesc: readBaselineField(t, section, 'protocolDesc'),
    authorityFooter: readBaselineField(t, section, 'authorityFooter'),
    features,
  };
}
