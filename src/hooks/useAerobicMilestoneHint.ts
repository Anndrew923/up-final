import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatAerobicDeltaTimeParts,
  resolve5KmMilestoneRawGap,
  resolveCooperMilestoneRawGap,
} from '../logic/core/aerobicMilestoneGap';
import {
  parse5KmTotalSeconds,
  parseCooperDistanceMeters,
  type CardioAssessmentTab,
} from '../logic/core/cardioScoring';
import type { PhysicalProfile } from '../types/userProfile';
import type { ScoreMeaningResult } from './useScoreMeaning';

function formatTimeString(
  t: (key: string, opts?: Record<string, string | number>) => string,
  deltaSeconds: number
): string {
  const parts = formatAerobicDeltaTimeParts(deltaSeconds);
  if (parts.underOneMinute) {
    return t('cardio.deltaTimeSecondsOnly', { sec: parts.seconds });
  }
  if (parts.seconds === 0) {
    return t('cardio.deltaTimeMinutesOnly', { min: parts.minutes });
  }
  return t('cardio.deltaTimeMinutesSeconds', {
    min: parts.minutes,
    sec: parts.seconds,
  });
}

/**
 * WHY: Keep CardioAssessmentPage presentational — Cooper Δm / 5 km Δtime + i18n stay in the hook.
 * IMPACT: Cooper needs age+sex (profileReady); 5 km uses profile?.gender with male default.
 */
export function useAerobicMilestoneHint(
  scoreMeaning: ScoreMeaningResult | null,
  tab: CardioAssessmentTab,
  distanceInput: string,
  runMinutesInput: string,
  runSecondsInput: string,
  profile: PhysicalProfile | null,
  profileReady: boolean
): string | null {
  const { t } = useTranslation('common');

  return useMemo(() => {
    if (
      !scoreMeaning ||
      scoreMeaning.nextMilestone === null ||
      scoreMeaning.remainingPoints === null
    ) {
      return null;
    }

    const points = scoreMeaning.remainingPoints;
    const pointsOnly = () => t('cardio.nextMilestoneHint', { points });

    if (tab === 'cooper') {
      if (!profileReady || !profile) return pointsOnly();

      const distanceMeters = parseCooperDistanceMeters(distanceInput);
      if (distanceMeters === null) return pointsOnly();

      const gap = resolveCooperMilestoneRawGap({
        nextMilestoneScore: scoreMeaning.nextMilestone,
        currentDistanceMeters: distanceMeters,
        age: profile.age,
        gender: profile.gender,
      });
      if (!gap) return pointsOnly();

      // WHY: Cooper form is meters-only — keep Δ display in meters (no unit-system conversion).
      return t('cardio.nextMilestoneHintWithRawCooper', {
        points,
        delta: gap.deltaMeters,
      });
    }

    const totalSeconds = parse5KmTotalSeconds(runMinutesInput, runSecondsInput);
    if (totalSeconds === null) return pointsOnly();

    // Align with tryComputeCardioAssessmentScore / calculate5KmScore gender fallback.
    const gender = profile?.gender ?? 'male';
    const gap = resolve5KmMilestoneRawGap({
      nextMilestoneScore: scoreMeaning.nextMilestone,
      currentTimeSeconds: totalSeconds,
      gender,
    });
    if (!gap) return pointsOnly();

    return t('cardio.nextMilestoneHintWithRaw5km', {
      points,
      timeString: formatTimeString(t, gap.deltaSeconds),
    });
  }, [
    distanceInput,
    profile,
    profileReady,
    runMinutesInput,
    runSecondsInput,
    scoreMeaning,
    t,
    tab,
  ]);
}
