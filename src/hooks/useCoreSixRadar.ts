import { useMemo } from 'react';
import {
  buildSixAxisRadarData,
  countCoreSixFilled,
  radarDisplayScaleMax,
} from '../logic/core/scoring';
import { useScoreStore } from '../stores/scoreStore';

/**
 * Read-only view of the six core dimensions for the home dashboard (decoupled from UI layout).
 */
export function useCoreSixRadar() {
  const scores = useScoreStore((s) => s.scores);
  const overallScore = useScoreStore((s) => s.overallScore);

  const radarPoints = useMemo(() => buildSixAxisRadarData(scores), [scores]);

  const scaleMax = useMemo(() => radarDisplayScaleMax(radarPoints), [radarPoints]);

  const completionCount = useMemo(() => countCoreSixFilled(scores), [scores]);

  return {
    radarPoints,
    overallScore,
    scaleMax,
    completionCount,
  };
}
