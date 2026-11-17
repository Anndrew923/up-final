/**
 * Map a single-leaf id onto score-meaning bands + language-stable plate titles.
 * WHY: Leaf reports show undiluted hero scores but still need the same human-scale
 * decade labels as assessment pages. Share-plate ZH/EN titles stay offline-stable
 * (not UI-locale dependent) so certificates never flip language mid-share.
 */
import type { ScoreMeaningBandMetric } from '../core/scoreMeaningCatalog';
import { COOPER_SCORE_MEANING_METRIC } from '../core/scoreMeaningCatalog';
import type { SingleLeafId } from './singleLeafReport';

export type SingleLeafEnglishNameKey =
  | 'benchPress'
  | 'squat'
  | 'deadlift'
  | 'latPulldown'
  | 'shoulderPress'
  | 'verticalJump'
  | 'standingLongJump'
  | 'sprint'
  | 'grip'
  | 'cooper'
  | 'run5km'
  | 'smm'
  | 'smPercent'
  | 'ffmi'
  | 'armSize';

export const SINGLE_LEAF_SCORE_MEANING_METRIC: Record<SingleLeafId, ScoreMeaningBandMetric> = {
  'strength.benchPress': 'strength',
  'strength.squat': 'strength',
  'strength.deadlift': 'strength',
  'strength.latPulldown': 'strength',
  'strength.shoulderPress': 'strength',
  'explosive.verticalJump': 'explosivePower',
  'explosive.standingLongJump': 'explosivePower',
  'explosive.sprint': 'explosivePower',
  grip: 'gripStrength',
  'cardio.cooper': COOPER_SCORE_MEANING_METRIC,
  'cardio.run5km': 'cardio',
  'muscle.smm': 'muscleMass',
  'muscle.smPercent': 'muscleMass',
  ffmi: 'bodyFat',
  armSize: 'armSize',
};

/** i18n key suffix under `aesthetic.singleLeaf.englishNames.*` / `labels.*`. */
export const SINGLE_LEAF_ENGLISH_NAME_KEY: Record<SingleLeafId, SingleLeafEnglishNameKey> = {
  'strength.benchPress': 'benchPress',
  'strength.squat': 'squat',
  'strength.deadlift': 'deadlift',
  'strength.latPulldown': 'latPulldown',
  'strength.shoulderPress': 'shoulderPress',
  'explosive.verticalJump': 'verticalJump',
  'explosive.standingLongJump': 'standingLongJump',
  'explosive.sprint': 'sprint',
  grip: 'grip',
  'cardio.cooper': 'cooper',
  'cardio.run5km': 'run5km',
  'muscle.smm': 'smm',
  'muscle.smPercent': 'smPercent',
  ffmi: 'ffmi',
  armSize: 'armSize',
};

/**
 * Language-stable Chinese primary titles for share plates.
 * PARITY: Keep in lockstep with `aesthetic.singleLeaf.labels` (zh-Hant).
 */
export const SINGLE_LEAF_ZH_TITLE: Record<SingleLeafId, string> = {
  'strength.benchPress': '槓鈴臥推',
  'strength.squat': '深蹲',
  'strength.deadlift': '硬舉',
  'strength.latPulldown': '滑輪下拉',
  'strength.shoulderPress': '肩推',
  'explosive.verticalJump': '垂直跳',
  'explosive.standingLongJump': '立定跳遠',
  'explosive.sprint': '百米衝刺',
  grip: '絕對握力',
  'cardio.cooper': '十二分鐘跑',
  'cardio.run5km': '五公里計時',
  'muscle.smm': '骨骼肌量',
  'muscle.smPercent': '骨骼肌率',
  ffmi: '去脂指數',
  armSize: '上臂圍度',
};

/**
 * Language-stable formal English secondary titles for share plates.
 * PARITY: Keep in lockstep with `aesthetic.singleLeaf.englishNames`.
 */
export const SINGLE_LEAF_EN_TITLE: Record<SingleLeafId, string> = {
  'strength.benchPress': 'BARBELL BENCH PRESS',
  'strength.squat': 'BARBELL BACK SQUAT',
  'strength.deadlift': 'BARBELL DEADLIFT',
  'strength.latPulldown': 'LAT PULLDOWN',
  'strength.shoulderPress': 'OVERHEAD PRESS',
  'explosive.verticalJump': 'VERTICAL JUMP',
  'explosive.standingLongJump': 'STANDING LONG JUMP',
  'explosive.sprint': '100M SPRINT',
  grip: 'PEAK GRIP STRENGTH',
  'cardio.cooper': '12-MINUTE COOPER RUN',
  'cardio.run5km': '5K TIME TRIAL',
  'muscle.smm': 'SKELETAL MUSCLE MASS',
  'muscle.smPercent': 'SKELETAL MUSCLE RATIO',
  ffmi: 'FAT-FREE MASS INDEX',
  armSize: 'UPPER ARM GIRTH',
};

export function scoreMeaningMetricForSingleLeaf(leaf: SingleLeafId): ScoreMeaningBandMetric {
  return SINGLE_LEAF_SCORE_MEANING_METRIC[leaf];
}

export function singleLeafEnglishNameKey(leaf: SingleLeafId): SingleLeafEnglishNameKey {
  return SINGLE_LEAF_ENGLISH_NAME_KEY[leaf];
}

export function singleLeafZhTitle(leaf: SingleLeafId): string {
  return SINGLE_LEAF_ZH_TITLE[leaf];
}

export function singleLeafEnTitle(leaf: SingleLeafId): string {
  return SINGLE_LEAF_EN_TITLE[leaf];
}
