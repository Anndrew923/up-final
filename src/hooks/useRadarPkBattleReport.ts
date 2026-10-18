import { useMemo } from 'react';
import {
  buildRadarPkBattleReport,
  type RadarPkBattleReport,
} from '../logic/core/radarPkBattleReport';
import type { ScoreMap } from '../types/scoring';

/**
 * Local PK battle report while compare is active.
 * WHY: Shared club / global memo so both sheets never diverge on gating or ScoreMap order.
 */
export function useRadarPkBattleReport(
  pkActive: boolean,
  targetScores: ScoreMap | null | undefined,
  viewerScores: ScoreMap | null | undefined
): RadarPkBattleReport | null {
  return useMemo(() => {
    if (!pkActive || !viewerScores) return null;
    return buildRadarPkBattleReport(targetScores, viewerScores);
  }, [pkActive, targetScores, viewerScores]);
}
