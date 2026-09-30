import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveSingleLiftMilestoneRawGap } from '../logic/core/singleLiftMilestoneGap';
import type { StrengthLiftKey } from '../types/strengthInputs';
import type { PhysicalProfile } from '../types/userProfile';
import type { ScoreMeaningResult } from './useScoreMeaning';
import { useUnit } from './useUnit';

/** Display mass in 0.1 steps without under-promising after kg→lb conversion. */
const ceil1Display = (n: number) => Math.ceil(n * 10 - 1e-12) / 10;

/**
 * WHY: Per-lift milestone copy stays out of StrengthAssessmentPage; composite stays points-only.
 * IMPACT: Points-only fallback when profile/weight/reps/rawGap cannot resolve.
 */
export function useSingleLiftMilestoneHint(
  liftType: StrengthLiftKey,
  scoreMeaning: ScoreMeaningResult | null,
  currentWeightKg: number | null,
  reps: number | null,
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
      return t('strength.liftNextMilestoneHint', { points });
    }

    if (
      currentWeightKg === null ||
      !(currentWeightKg > 0) ||
      reps === null ||
      !Number.isInteger(reps) ||
      reps < 1
    ) {
      return t('strength.liftNextMilestoneHint', { points });
    }

    const gap = resolveSingleLiftMilestoneRawGap({
      liftType,
      currentWeightKg,
      reps,
      bodyWeightKg: profile.weightKg,
      gender: profile.gender,
      age: profile.age,
      nextMilestoneScore: scoreMeaning.nextMilestone,
    });

    if (!gap) {
      return t('strength.liftNextMilestoneHint', { points });
    }

    // WHY: Nearest-tenth round can shrink lb below the verified kg gate (same as FFMI/SMM).
    return t('strength.liftNextMilestoneHintWithRaw', {
      points,
      delta: Math.max(0.1, ceil1Display(displayWeight(gap.delta))),
      unit: labels.weight,
    });
  }, [
    currentWeightKg,
    displayWeight,
    labels.weight,
    liftType,
    profile,
    profileReady,
    reps,
    scoreMeaning,
    t,
  ]);
}
