import type { FfmiFemaleCategorySuffix, FfmiMaleCategorySuffix } from './ffmiScoring';

/** Display order for reference tables — aligns with `ffmi.category.*` suffix keys. */
export const FFMI_TABLE_MALE_ORDER: readonly FfmiMaleCategorySuffix[] = [
  'r16_17',
  'r18_19',
  'r20_21',
  'r22',
  'r23_25',
  'r26_27',
  'r28_30',
] as const;

export const FFMI_TABLE_FEMALE_ORDER: readonly FfmiFemaleCategorySuffix[] = [
  'r13_14',
  'r15_16',
  'r17_18',
  'r19_21',
  'r22plus',
] as const;
