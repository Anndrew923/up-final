import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveExplosiveMilestoneRawGap } from '../logic/core/powerMilestoneGap';
import type { PhysicalProfile } from '../types/userProfile';
import type { ScoreMeaningResult } from './useScoreMeaning';
import { useUnit } from './useUnit';

function parsePositiveCm(raw: string | null | undefined): number | null {
  if (raw == null || String(raw).trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function formatDeltaDisplay(cm: number, displayLength: (cmValue: number) => number): number {
  return Math.round(displayLength(cm) * 10) / 10;
}

/**
 * WHY: Keep ExplosiveAssessmentPage presentational — dual-jump or-path invert + i18n stay in the hook.
 * IMPACT: Points-only fallback when profile/rawGap cannot resolve; single-path copy when one leg caps out.
 */
export function useExplosiveMilestoneHint(
  scoreMeaning: ScoreMeaningResult | null,
  metricJumpInputs: {
    verticalJumpInput: string;
    standingLongJumpInput: string;
  },
  profile: PhysicalProfile | null,
  profileReady: boolean
): string | null {
  const { t } = useTranslation('common');
  const { labels, displayLength } = useUnit();

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
      return t('explosive.nextMilestoneHint', { points });
    }

    const rawGap = resolveExplosiveMilestoneRawGap({
      targetCompositeScore: scoreMeaning.nextMilestone,
      currentVjCm: parsePositiveCm(metricJumpInputs.verticalJumpInput),
      currentSljCm: parsePositiveCm(metricJumpInputs.standingLongJumpInput),
      profile,
    });

    if (!rawGap) {
      return t('explosive.nextMilestoneHint', { points });
    }

    const vJumpDeltaCm = rawGap.vJumpDeltaCm;
    const bJumpDeltaCm = rawGap.bJumpDeltaCm;

    if (vJumpDeltaCm != null && bJumpDeltaCm != null) {
      return t('explosive.nextMilestoneHintWithRawBoth', {
        points,
        vJump: formatDeltaDisplay(vJumpDeltaCm, displayLength),
        bJump: formatDeltaDisplay(bJumpDeltaCm, displayLength),
        unit: labels.length,
      });
    }

    if (vJumpDeltaCm != null) {
      return t('explosive.nextMilestoneHintWithRawVJump', {
        points,
        vJump: formatDeltaDisplay(vJumpDeltaCm, displayLength),
        unit: labels.length,
      });
    }

    if (bJumpDeltaCm != null) {
      return t('explosive.nextMilestoneHintWithRawBJump', {
        points,
        bJump: formatDeltaDisplay(bJumpDeltaCm, displayLength),
        unit: labels.length,
      });
    }

    return t('explosive.nextMilestoneHint', { points });
  }, [
    displayLength,
    labels.length,
    metricJumpInputs.standingLongJumpInput,
    metricJumpInputs.verticalJumpInput,
    profile,
    profileReady,
    scoreMeaning,
    t,
  ]);
}
