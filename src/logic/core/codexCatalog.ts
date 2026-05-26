import {
  getScoreMeaningBands,
  OVERALL_GRADE_TIERS,
  type ScoreBand,
  type ScoreMeaningBandMetric,
} from './scoreMeaningCatalog';

export type CodexTab =
  | 'overall'
  | 'strength'
  | 'explosivePower'
  | 'gripStrength'
  | 'cooper'
  | 'fiveK'
  | 'muscleMass'
  | 'bodyFat'
  | 'armSize';

export const CODEX_TABS: readonly CodexTab[] = [
  'overall',
  'strength',
  'explosivePower',
  'gripStrength',
  'cooper',
  'fiveK',
  'muscleMass',
  'bodyFat',
  'armSize',
] as const;

export type VehicleCodexScores = {
  overall: number;
  strength: number;
  explosivePower: number;
  gripStrength: number;
  /** Cooper 12-min and 5K cruise share the resolved cardio score. */
  cardio: number;
  muscleMass: number;
  bodyFat: number;
  armSize: number;
};

/** Maps UI tab to band-copy metric; overall has no axis metric. */
export function getMetricForCodexTab(tab: CodexTab): ScoreMeaningBandMetric | null {
  if (tab === 'overall') return null;
  if (tab === 'cooper') return 'cooper';
  if (tab === 'fiveK') return 'cardio';
  return tab;
}

export function getBandsForCodexTab(tab: CodexTab): readonly ScoreBand[] {
  if (tab === 'overall') return OVERALL_GRADE_TIERS;
  const metric = getMetricForCodexTab(tab);
  if (!metric) return OVERALL_GRADE_TIERS;
  return getScoreMeaningBands(metric);
}

export function getUserScoreForCodexTab(tab: CodexTab, scores: VehicleCodexScores): number {
  if (tab === 'cooper' || tab === 'fiveK') return scores.cardio;
  return scores[tab] ?? 0;
}

/** Pantheon uses open-ended display; other tiers show min–max. */
export function formatCodexTierRange(band: ScoreBand): string {
  if (band.id === 'PANTHEON') return `${band.min}+`;
  return `${band.min} - ${band.max}`;
}
