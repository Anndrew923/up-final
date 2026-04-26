import { mergeScoreMapForHomeRadar } from '../logic/core/radarMergedScores';
import type { ScoreMap } from '../types/scoring';
import { useScoreStore } from '../stores/scoreStore';
import {
  loadCardioInputs,
  loadGripInputs,
  loadMuscleInputs,
  loadPhysicalProfile,
  loadPowerInputs,
  loadStrengthInputs,
} from './localStorageService';

/**
 * Same merged six-axis map as Home radar / `useMergedScoresFromLocalStores`, for service-layer writes
 * (e.g. ladder overall upload → full `leaderboard_previews` radar snapshot).
 */
export function getMergedScoresSnapshotForRadar(): ScoreMap {
  return mergeScoreMapForHomeRadar({
    scores: useScoreStore.getState().scores,
    profile: loadPhysicalProfile(),
    cardioInputs: loadCardioInputs(),
    muscleInputs: loadMuscleInputs(),
    powerInputs: loadPowerInputs(),
    strengthInputs: loadStrengthInputs(),
    gripInputs: loadGripInputs(),
  });
}
