import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseSmmKg } from '../logic/core/muscleScoring';
import { resolveMuscleMilestoneRawGap } from '../logic/core/muscleMilestoneGap';
import type { PhysicalProfile } from '../types/userProfile';
import type { ScoreMeaningResult } from './useScoreMeaning';
import { useUnit } from './useUnit';

/** Display mass in 0.1 steps without under-promising after kg→lb conversion. */
const ceil1Display = (n: number) => Math.ceil(n * 10 - 1e-12) / 10;

/**
 * WHY: Keep MuscleAssessmentPage presentational — ΔSMM invert + unit display + i18n stay in the hook.
 * IMPACT: Points-only fallback when profile/SMM/rawGap cannot resolve (same MVP contract as grip/FFMI).
 */
export function useMuscleMilestoneHint(
  scoreMeaning: ScoreMeaningResult | null,
  smmInput: string,
  profile: PhysicalProfile | null,
  profileReady: boolean
): string | null {
  const { t } = useTranslation('common');
  const { labels, displayWeight } = useUnit();

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
      return t('muscle.nextMilestoneHint', { points });
    }

    const currentSmmKg = parseSmmKg(smmInput);
    if (currentSmmKg === null) {
      return t('muscle.nextMilestoneHint', { points });
    }

    const gap = resolveMuscleMilestoneRawGap({
      nextMilestoneScore: scoreMeaning.nextMilestone,
      currentSmmKg,
      bodyWeightKg: profile.weightKg,
      gender: profile.gender,
      age: profile.age,
    });

    if (!gap) {
      return t('muscle.nextMilestoneHint', { points });
    }

    // WHY: Nearest-tenth round can shrink lb below the verified kg gate (same as FFMI leanGain).
    return t('muscle.nextMilestoneHintWithRaw', {
      points,
      delta: Math.max(0.1, ceil1Display(displayWeight(gap.delta))),
      unit: labels.weight,
    });
  }, [
    displayWeight,
    labels.weight,
    profile,
    profileReady,
    scoreMeaning,
    smmInput,
    t,
  ]);
}
