import { useMemo } from 'react';
import type { VehicleCodexScores } from '../logic/core/codexCatalog';
import { useCoreSixRadar } from './useCoreSixRadar';
import { useMergedScoresFromLocalStores } from './useMergedScoresFromLocalStores';

/** Home-aligned score snapshot for the tools codex — no extra Firestore reads. */
export function useVehicleCodexScores(): VehicleCodexScores {
  const mergedScores = useMergedScoresFromLocalStores();
  const { overallScore } = useCoreSixRadar();

  return useMemo(
    (): VehicleCodexScores => ({
      overall: overallScore ?? 0,
      strength: mergedScores.strength ?? 0,
      explosivePower: mergedScores.explosivePower ?? 0,
      gripStrength: mergedScores.gripStrength ?? 0,
      cardio: mergedScores.cardio ?? 0,
      muscleMass: mergedScores.muscleMass ?? 0,
      bodyFat: mergedScores.bodyFat ?? 0,
      armSize: mergedScores.armSize ?? 0,
    }),
    [mergedScores, overallScore]
  );
}
