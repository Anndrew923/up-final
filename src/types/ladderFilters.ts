import type { ReactNode } from 'react';
import type {
  LadderAgeBucket,
  LadderCountryCode,
  LadderHeightBucket,
  LadderJobCategory,
  LadderWeightBucket,
} from './ladderProfile';
import type { LadderDivisionId } from '../logic/core/ladderShards';

export interface LadderFilterValues {
  division: LadderDivisionId;
  filterProject: string;
  gender: 'all' | 'male' | 'female';
  ageBucket: LadderAgeBucket | 'all';
  heightBucket: LadderHeightBucket | 'all';
  weightBucket: LadderWeightBucket | 'all';
  jobCategory: LadderJobCategory | 'all';
  countryCode: 'all' | LadderCountryCode;
  city: string | 'all';
  district: string | 'all';
}

export interface LadderSelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface LadderFilterSheetProps {
  open: boolean;
  values: LadderFilterValues;
  activeFilterCount: number;
  hasUnappliedChanges: boolean;
  projectOptions: readonly LadderSelectOption[];
  genderOptions: readonly LadderSelectOption<'male' | 'female'>[];
  ageBucketOptions: readonly LadderSelectOption<LadderAgeBucket>[];
  heightBucketOptions: readonly LadderSelectOption<LadderHeightBucket>[];
  weightBucketOptions: readonly LadderSelectOption<LadderWeightBucket>[];
  jobCategoryOptions: readonly LadderSelectOption<LadderJobCategory>[];
  countrySelectOptions: readonly LadderSelectOption<LadderCountryCode>[];
  citySelectOptions: readonly LadderSelectOption<string>[];
  districtSelectOptions: readonly LadderSelectOption<string>[];
  effectiveCityValue: string | 'all';
  effectiveDistrictValue: string | 'all';
  syncAllSlot?: ReactNode;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  onDivisionChange: (next: LadderDivisionId) => void;
  onProjectChange: (next: string) => void;
  onGenderChange: (next: LadderFilterValues['gender']) => void;
  onAgeBucketChange: (next: LadderFilterValues['ageBucket']) => void;
  onHeightBucketChange: (next: LadderFilterValues['heightBucket']) => void;
  onWeightBucketChange: (next: LadderFilterValues['weightBucket']) => void;
  onJobCategoryChange: (next: LadderFilterValues['jobCategory']) => void;
  onCountryCodeChange: (next: LadderFilterValues['countryCode']) => void;
  onCityChange: (next: LadderFilterValues['city']) => void;
  onDistrictChange: (next: LadderFilterValues['district']) => void;
}
