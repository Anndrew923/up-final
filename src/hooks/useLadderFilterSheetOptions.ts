import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LADDER_AGE_BUCKETS,
  LADDER_HEIGHT_BUCKETS,
  LADDER_JOB_CATEGORIES,
  LADDER_REGION_SCOPES,
  LADDER_WEIGHT_BUCKETS,
} from '../types/ladderProfile';
import type { LadderAgeBucket, LadderHeightBucket, LadderJobCategory, LadderWeightBucket } from '../types/ladderProfile';
import { getTaiwanCityLabel, getTaiwanDistrictLabel } from '../utils/taiwanDistricts';

export interface LadderFilterGenderOption {
  value: 'male' | 'female';
  label: string;
}

export interface LadderFilterSheetOptions {
  genderOptions: readonly LadderFilterGenderOption[];
  ageBucketOptions: { value: LadderAgeBucket; label: string }[];
  heightBucketOptions: { value: LadderHeightBucket; label: string }[];
  weightBucketOptions: { value: LadderWeightBucket; label: string }[];
  jobCategoryOptions: { value: LadderJobCategory; label: string }[];
  regionScopeOptions: { value: (typeof LADDER_REGION_SCOPES)[number]; label: string }[];
  twCitySelectOptions: { value: string; label: string }[];
  twDistrictSelectOptions: { value: string; label: string }[];
}

/**
 * Memoized i18n + TW labels for ladder filter sheets. Keeps `LadderPage` presentational
 * and avoids rebuilding option rows on unrelated renders.
 */
export function useLadderFilterSheetOptions(
  twCityValues: readonly string[],
  twDistrictValues: readonly string[]
): LadderFilterSheetOptions {
  const { t, i18n } = useTranslation();

  const genderOptions = useMemo(
    (): readonly LadderFilterGenderOption[] => [
      { value: 'male', label: t('home.profile.male') },
      { value: 'female', label: t('home.profile.female') },
    ],
    [t]
  );

  const ageBucketOptions = useMemo(
    () =>
      LADDER_AGE_BUCKETS.map((value) => ({
        value,
        label: t(`ladder.filters.ageBucketOptions.${value}`),
      })),
    [t]
  );

  const heightBucketOptions = useMemo(
    () =>
      LADDER_HEIGHT_BUCKETS.map((value) => ({
        value,
        label: t(`ladder.filters.heightBucketOptions.${value}`),
      })),
    [t]
  );

  const weightBucketOptions = useMemo(
    () =>
      LADDER_WEIGHT_BUCKETS.map((value) => ({
        value,
        label: t(`ladder.filters.weightBucketOptions.${value}`),
      })),
    [t]
  );

  const jobCategoryOptions = useMemo(
    () =>
      LADDER_JOB_CATEGORIES.map((value) => ({
        value,
        label: t(`home.profile.jobOptions.${value}`),
      })),
    [t]
  );

  const regionScopeOptions = useMemo(
    () =>
      LADDER_REGION_SCOPES.map((value) => ({
        value,
        label: t(`ladder.filters.regionScopeOptions.${value}`),
      })),
    [t]
  );

  const twCitySelectOptions = useMemo(
    () =>
      twCityValues.map((value) => ({
        value,
        label: getTaiwanCityLabel(value, i18n.language),
      })),
    [twCityValues, i18n.language]
  );

  const twDistrictSelectOptions = useMemo(
    () =>
      twDistrictValues.map((value) => ({
        value,
        label: getTaiwanDistrictLabel(value, i18n.language),
      })),
    [twDistrictValues, i18n.language]
  );

  return {
    genderOptions,
    ageBucketOptions,
    heightBucketOptions,
    weightBucketOptions,
    jobCategoryOptions,
    regionScopeOptions,
    twCitySelectOptions,
    twDistrictSelectOptions,
  };
}
