import { useEffect, useMemo } from 'react';
import {
  buildSixAxisRadarData,
  calculateSixAxisOverall,
  countCoreSixFilled,
  radarDisplayScaleMax,
} from '../logic/core/scoring';
import { buildWidgetSnapshot, saveWidgetSnapshot } from '../services/widgetSnapshotService';
import { useMergedScoresFromLocalStores } from './useMergedScoresFromLocalStores';

/**
 * Home radar + overall: merges Cooper / 5 km over `scores.cardio` and saved SMM over `scores.muscleMass`
 * when local inputs + profile resolve (see `useMergedScoresFromLocalStores`).
 */
export function useCoreSixRadar() {
  const mergedMap = useMergedScoresFromLocalStores();

  const radarPoints = useMemo(() => buildSixAxisRadarData(mergedMap), [mergedMap]);

  const overallScore = useMemo(() => calculateSixAxisOverall(mergedMap), [mergedMap]);

  const completionCount = useMemo(() => countCoreSixFilled(mergedMap), [mergedMap]);

  const scaleMax = useMemo(() => radarDisplayScaleMax(radarPoints), [radarPoints]);

  useEffect(() => {
    saveWidgetSnapshot(buildWidgetSnapshot(mergedMap, overallScore));
  }, [mergedMap, overallScore]);

  return {
    radarPoints,
    /** Display overall (resolved cardio); may differ from `scoreStore.overallScore` when only inputs/age change. */
    overallScore,
    scaleMax,
    completionCount,
  };
}
