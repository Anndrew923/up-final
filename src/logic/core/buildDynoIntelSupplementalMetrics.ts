import type { CardioInputsPersisted } from '../../types/cardioInputs';
import {
  getBandMeaningI18nPrefix,
  resolveScoreMeaningBand,
  scoreMeaningMetricForCardioTab,
  type ScoreMeaningBandMetric,
} from './scoreMeaningCatalog';
import {
  tryComputeCardioAssessmentScore,
  type CardioAssessmentTab,
} from './cardioScoring';
import type {
  DynoSupplementalMetricId,
  DynoSupplementalMetricSnapshot,
} from './dynoIntelTypes';
import { isPhysicalProfileComplete } from './physicalProfile';
import type { RadarMergedScoresInput } from './radarMergedScores';
import { clampScoreMapValue } from './scoring';

const round2 = (value: number) => Math.round(value * 100) / 100;

const CARDIO_TABS: readonly CardioAssessmentTab[] = ['cooper', '5km'];

function readPersistedCardioFormInputs(inputs: CardioInputsPersisted | null | undefined) {
  const raw = inputs ?? {};
  return {
    distanceInput: raw.cardio?.distance != null ? String(raw.cardio.distance) : '',
    runMinutesInput: raw.run_5km?.minutes != null ? String(raw.run_5km.minutes) : '',
    runSecondsInput: raw.run_5km?.seconds != null ? String(raw.run_5km.seconds) : '',
  };
}

function buildSupplementalEntry(
  metric: DynoSupplementalMetricId,
  score: number
): DynoSupplementalMetricSnapshot {
  const clamped = clampScoreMapValue(score);
  const meaningMetric =
    metric === 'armSize' ? 'armSize' : scoreMeaningMetricForCardioTab(metric);
  const band = resolveScoreMeaningBand(meaningMetric, clamped);
  return {
    metric,
    score: round2(clamped),
    tierBandId: band.id,
    meaningI18nPrefix: getBandMeaningI18nPrefix(meaningMetric, band.id),
    cardCopy: null,
  };
}

/**
 * Assembles supplemental telemetry (armSize + cardio sub-tests) outside the six-axis radar.
 * WHY: Arm circumference and Cooper/5km decode use dedicated scoreMeaning bands — not generic cardio axis copy.
 */
export function buildDynoIntelSupplementalMetrics(
  radarInput: RadarMergedScoresInput
): DynoSupplementalMetricSnapshot[] {
  const metrics: DynoSupplementalMetricSnapshot[] = [];
  const profile = radarInput.profile;
  const profileReady = profile != null && isPhysicalProfileComplete(profile);
  const form = readPersistedCardioFormInputs(radarInput.cardioInputs);

  const armSize = radarInput.scores.armSize;
  if (armSize != null && Number.isFinite(armSize) && armSize > 0) {
    metrics.push(buildSupplementalEntry('armSize', armSize));
  }

  for (const tab of CARDIO_TABS) {
    const result = tryComputeCardioAssessmentScore({
      tab,
      distanceInput: form.distanceInput,
      runMinutesInput: form.runMinutesInput,
      runSecondsInput: form.runSecondsInput,
      profile: profile ?? null,
      profileReady,
    });
    if (result.ok && result.score > 0) {
      metrics.push(buildSupplementalEntry(tab, result.score));
    }
  }

  return metrics;
}

/** Maps supplemental metric id → scoreMeaning band metric for i18n card copy. */
export function dynoSupplementalScoreMeaningMetric(
  metric: DynoSupplementalMetricId
): ScoreMeaningBandMetric {
  if (metric === 'armSize') return 'armSize';
  return scoreMeaningMetricForCardioTab(metric);
}
