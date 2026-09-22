import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveGripMilestoneRawGap } from '../logic/core/gripStrength';
import type { PhysicalProfile } from '../types/userProfile';
import type { ScoreMeaningResult } from './useScoreMeaning';
import { useUnit } from './useUnit';

/**
 * WHY: Keep GripAssessmentPage presentational — raw-gap invert + i18n assembly stay in the hook layer.
 * IMPACT: Points-only fallback when peak/profile/rawGap cannot resolve (Phase 1 MVP contract).
 */
export function useGripMilestoneHint(
  scoreMeaning: ScoreMeaningResult | null,
  peakInput: string,
  profile: PhysicalProfile | null,
  profileReady: boolean
): string | null {
  const { t } = useTranslation('common');
  const { labels, displayWeight, parseInputToMetric } = useUnit();

  return useMemo(() => {
    if (
      !scoreMeaning ||
      scoreMeaning.nextMilestone === null ||
      scoreMeaning.remainingPoints === null
    ) {
      return null;
    }

    const points = scoreMeaning.remainingPoints;
    if (!profileReady || !profile) {
      return t('grip.nextMilestoneHint', { points });
    }

    const currentPeakKg = parseInputToMetric(peakInput, 'weight');
    if (currentPeakKg === null || currentPeakKg <= 0) {
      return t('grip.nextMilestoneHint', { points });
    }

    const rawGap = resolveGripMilestoneRawGap({
      currentPeakKg,
      targetScore: scoreMeaning.nextMilestone,
      weightKg: profile.weightKg,
      gender: profile.gender,
    });

    if (!rawGap) {
      return t('grip.nextMilestoneHint', { points });
    }

    return t('grip.nextMilestoneHintWithRaw', {
      points,
      delta: Math.round(displayWeight(rawGap.delta) * 10) / 10,
      unit: labels.weight,
    });
  }, [
    displayWeight,
    labels.weight,
    parseInputToMetric,
    peakInput,
    profile,
    profileReady,
    scoreMeaning,
    t,
  ]);
}
