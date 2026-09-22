import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseFfmiBodyFatPctInput } from '../logic/core/ffmiScoring';
import { resolveFfmiMilestoneRawGap } from '../logic/core/ffmiMilestoneGap';
import type { PhysicalProfile } from '../types/userProfile';
import type { ScoreMeaningResult } from './useScoreMeaning';
import { useUnit } from './useUnit';

/** Display mass in 0.1 steps without under-promising after kg→lb conversion. */
const ceil1Display = (n: number) => Math.ceil(n * 10 - 1e-12) / 10;

/**
 * WHY: Keep FfmiPage presentational — dual-state fatLoss/leanGain + unit display stay in the hook.
 * IMPACT: Points-only only when both guidance paths cannot resolve.
 */
export function useFfmiMilestoneHint(
  scoreMeaning: ScoreMeaningResult | null,
  bodyFatInput: string,
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
      return t('ffmi.nextMilestoneHint', { points });
    }

    const bfPct = parseFfmiBodyFatPctInput(bodyFatInput);
    if (bfPct === null) {
      return t('ffmi.nextMilestoneHint', { points });
    }

    const heightM = profile.heightCm / 100;
    const gap = resolveFfmiMilestoneRawGap({
      nextMilestoneScore: scoreMeaning.nextMilestone,
      currentWeightKg: profile.weightKg,
      currentBfPercent: bfPct,
      heightM,
      gender: profile.gender,
    });

    if (!gap) {
      return t('ffmi.nextMilestoneHint', { points });
    }

    if (gap.type === 'fatLoss') {
      return t('ffmi.nextMilestoneHintWithFatLoss', {
        points,
        delta: gap.delta,
      });
    }

    // WHY: Nearest-tenth round can shrink lb below the verified kg gate (Bugbot medium).
    return t('ffmi.nextMilestoneHintWithLeanGain', {
      points,
      delta: Math.max(0.1, ceil1Display(displayWeight(gap.delta))),
      unit: labels.weight,
    });
  }, [
    bodyFatInput,
    displayWeight,
    labels.weight,
    profile,
    profileReady,
    scoreMeaning,
    t,
  ]);
}
