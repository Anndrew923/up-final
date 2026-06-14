import type { DynoScoringMethodologyMetricId } from './dynoIntelTypes';

export interface DynoScoringMethodologyCatalogEntry {
  metric: DynoScoringMethodologyMetricId;
  titleKey: string;
  bodyKeys: readonly string[];
}

/**
 * i18n key paths for product scoring methodology — single source aligned with assessment pages.
 * WHY: Dyno Intel must narrate pre-authored copy, never invent coefficients.
 */
export const DYNO_SCORING_METHODOLOGY_CATALOG: readonly DynoScoringMethodologyCatalogEntry[] = [
  {
    metric: 'strength',
    titleKey: 'strength.howToInfo.title',
    bodyKeys: [
      'strength.howToInfo.intro',
      'strength.howToInfo.reps',
      'strength.howToInfo.combinedRule',
      'strength.fieldsHint',
    ],
  },
  {
    metric: 'explosivePower',
    titleKey: 'explosive.standardsInfo.title',
    bodyKeys: [
      'explosive.standardsInfo.disclaimer',
      'explosive.fieldsHint',
      'explosive.standardsInfo.remark',
    ],
  },
  {
    metric: 'cardio',
    titleKey: 'cardio.title',
    bodyKeys: ['cardio.subtitle', 'cardio.cooperInfo.p3', 'cardio.run5kmHint'],
  },
  {
    metric: 'muscleMass',
    titleKey: 'muscle.title',
    bodyKeys: [
      'muscle.standardsInfo.p2',
      'muscle.standardsInfo.p3',
      'muscle.standardsInfo.p4',
      'muscle.standardsInfo.dualSovereignPreamble',
      'muscle.standardsInfo.dualSovereignMale',
      'muscle.standardsInfo.dualSovereignFemale',
    ],
  },
  {
    metric: 'bodyFat',
    titleKey: 'ffmi.title',
    bodyKeys: [
      'ffmi.info.whatIsIntro',
      'ffmi.info.caveats.tall',
      'ffmi.table.sectionHint',
      'ffmi.subtitle',
    ],
  },
  {
    metric: 'gripStrength',
    titleKey: 'grip.referenceInfo.title',
    bodyKeys: [
      'grip.referenceInfo.p1',
      'grip.referenceInfo.p2',
      'grip.referenceInfo.p3',
      'grip.referenceInfo.p4',
    ],
  },
  {
    metric: 'armSize',
    titleKey: 'armSize.referenceInfo.title',
    bodyKeys: ['armSize.referenceInfo.p1', 'armSize.referenceInfo.p2', 'armSize.referenceInfo.p3'],
  },
  {
    metric: 'cooper',
    titleKey: 'cardio.cooperInfo.title',
    bodyKeys: ['cardio.cooperInfo.p3', 'cardio.cooperInfo.p5'],
  },
  {
    metric: '5km',
    titleKey: 'cardio.tab5km',
    bodyKeys: ['cardio.run5kmHint', 'cardio.subtitle'],
  },
] as const;

export const DYNO_SCORING_METHODOLOGY_METRIC_IDS: readonly DynoScoringMethodologyMetricId[] =
  DYNO_SCORING_METHODOLOGY_CATALOG.map((entry) => entry.metric);
