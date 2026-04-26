import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LADDER_AGE_BUCKETS,
  LADDER_HEIGHT_BUCKETS,
  LADDER_JOB_CATEGORIES,
  LADDER_WEIGHT_BUCKETS,
} from '../types/ladderProfile';
import type {
  LadderAgeBucket,
  LadderCountryCode,
  LadderHeightBucket,
  LadderJobCategory,
  LadderWeightBucket,
} from '../types/ladderProfile';
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
  countrySelectOptions: { value: LadderCountryCode; label: string }[];
  twCitySelectOptions: { value: string; label: string }[];
  twDistrictSelectOptions: { value: string; label: string }[];
}

export interface LadderFilterSheetLocationContext {
  /** Country codes present on the current shard dataset (deduped). */
  countryCodes?: readonly LadderCountryCode[];
  /** When true, city/district labels use Taiwan dictionary; otherwise raw stored strings. */
  locationLabelsTw?: boolean;
}

/**
 * Memoized i18n + TW labels for ladder filter sheets. Keeps `LadderPage` presentational
 * and avoids rebuilding option rows on unrelated renders.
 */
export function useLadderFilterSheetOptions(
  cityValues: readonly string[],
  districtValues: readonly string[],
  locationContext?: LadderFilterSheetLocationContext
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

  const countrySelectOptions = useMemo(
    () =>
      (locationContext?.countryCodes ?? []).map((value) => ({
        value,
        label: t(`home.profile.countryOptions.${value}`, { ns: 'common' }),
      })),
    [locationContext?.countryCodes, t]
  );

  const useTwLocationLabels = locationContext?.locationLabelsTw === true;

  const twCitySelectOptions = useMemo(
    () =>
      cityValues.map((value) => ({
        value,
        label: useTwLocationLabels ? getTaiwanCityLabel(value, i18n.language) : value,
      })),
    [cityValues, i18n.language, useTwLocationLabels]
  );

  const twDistrictSelectOptions = useMemo(
    () =>
      districtValues.map((value) => ({
        value,
        label: useTwLocationLabels ? getTaiwanDistrictLabel(value, i18n.language) : value,
      })),
    [districtValues, i18n.language, useTwLocationLabels]
  );

  return {
    genderOptions,
    ageBucketOptions,
    heightBucketOptions,
    weightBucketOptions,
    jobCategoryOptions,
    countrySelectOptions,
    twCitySelectOptions,
    twDistrictSelectOptions,
  };
}
