/**
 * WHY: Lives outside trainingFootprintService so we never cycle
 * localStorageService → footprint service → cardio/power/lab loaders.
 */
import { isHeathCarterComputable } from '../logic/core/somatotypeLab';
import { resolveRun5KmFinishSeconds, type SpecBadgeDeriveInput } from '../logic/core/trainingFootprintBadges';
import type { ScoreMap } from '../types/scoring';
import { loadCardioInputs, loadHistory, loadPowerInputs, loadScores, loadSomatotypeLabInputs } from './localStorageService';
import { persistUnlockedBadgeUnion } from './trainingFootprintService';

export function snapshotSpecBadgeDeriveInput(
  scores: ScoreMap,
  historyLength: number
): SpecBadgeDeriveInput {
  return {
    scores,
    historyLength,
    run5KmTotalSeconds: resolveRun5KmFinishSeconds(loadCardioInputs()?.run_5km),
    sprintSeconds: loadPowerInputs()?.explosivePower?.sprintSeconds ?? null,
    somatotypeChartComplete: isHeathCarterComputable(loadSomatotypeLabInputs()),
  };
}

/**
 * Stamp unlocked IDs onto the footprint blob without recording a heatmap day.
 * Prefer live store values when the caller already has them (History page).
 */
export function persistSpecBadgeUnionFromDevice(
  scores: ScoreMap = loadScores(),
  historyLength: number = loadHistory().length
): void {
  persistUnlockedBadgeUnion(snapshotSpecBadgeDeriveInput(scores, historyLength));
}
