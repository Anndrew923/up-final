/**
 * WHY: Lives outside trainingFootprintService so we never cycle
 * localStorageService → footprint service → cardio/power loaders.
 */
import { loadCardioInputs, loadPowerInputs } from './localStorageService';
import { resolveRun5KmFinishSeconds, type SpecBadgeDeriveInput } from '../logic/core/trainingFootprintBadges';
import type { ScoreMap } from '../types/scoring';

export function snapshotSpecBadgeDeriveInput(
  scores: ScoreMap,
  historyLength: number
): SpecBadgeDeriveInput {
  return {
    scores,
    historyLength,
    run5KmTotalSeconds: resolveRun5KmFinishSeconds(loadCardioInputs()?.run_5km),
    sprintSeconds: loadPowerInputs()?.explosivePower?.sprintSeconds ?? null,
  };
}
