import { useEffect, useMemo, useState } from 'react';
import type { RadarMergedScoresInput } from '../logic/core/radarMergedScores';
import type { DynoHistoryRecordSlice } from '../logic/core/dynoIntelTypes';
import type { ScoreMap } from '../types/scoring';
import {
  CARDIO_INPUTS_STORAGE_KEY,
  GRIP_INPUTS_STORAGE_KEY,
  MUSCLE_INPUTS_STORAGE_KEY,
  POWER_INPUTS_STORAGE_KEY,
  PHYSICAL_PROFILE_STORAGE_KEY,
  STRENGTH_INPUTS_STORAGE_KEY,
  loadCardioInputs,
  loadGripInputs,
  loadHistory,
  loadMuscleInputs,
  loadPhysicalProfile,
  loadPowerInputs,
  loadStrengthInputs,
  subscribeCardioInputs,
  subscribeMuscleInputs,
  subscribePhysicalProfile,
  subscribePowerInputs,
  subscribeGripInputs,
  subscribeStrengthInputs,
} from '../services/localStorageService';
import { useHistoryStore } from '../stores/historyStore';
import { useDynoIntelScoreDraftStore } from '../stores/dynoIntelScoreDraftStore';
import { useScoreStore } from '../stores/scoreStore';

export type DynoIntelRadarSnapshot = RadarMergedScoresInput & {
  historyRecords: readonly DynoHistoryRecordSlice[];
  liveScoreOverrides: ScoreMap;
};

/**
 * Reactive local-first snapshot for DYNO INTEL context assembly.
 */
export function useDynoIntelContextBuilder(): () => DynoIntelRadarSnapshot {
  const scores = useScoreStore((s) => s.scores);
  const liveScoreOverrides = useDynoIntelScoreDraftStore((s) => s.overrides);
  const historyRecords = useHistoryStore((s) => s.records);
  const [localEpoch, setLocalEpoch] = useState(0);

  useEffect(() => {
    useHistoryStore.getState().loadLocalHistory();
  }, []);

  useEffect(() => {
    const bump = () => setLocalEpoch((n) => n + 1);
    const unsubP = subscribePhysicalProfile(bump);
    const unsubC = subscribeCardioInputs(bump);
    const unsubM = subscribeMuscleInputs(bump);
    const unsubPw = subscribePowerInputs(bump);
    const unsubSt = subscribeStrengthInputs(bump);
    const unsubGrip = subscribeGripInputs(bump);

    const onStorage = (e: StorageEvent) => {
      const k = e.key;
      if (
        k !== null &&
        k !== CARDIO_INPUTS_STORAGE_KEY &&
        k !== MUSCLE_INPUTS_STORAGE_KEY &&
        k !== POWER_INPUTS_STORAGE_KEY &&
        k !== STRENGTH_INPUTS_STORAGE_KEY &&
        k !== GRIP_INPUTS_STORAGE_KEY &&
        k !== PHYSICAL_PROFILE_STORAGE_KEY
      ) {
        return;
      }
      bump();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubP();
      unsubC();
      unsubM();
      unsubPw();
      unsubSt();
      unsubGrip();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const snapshot = useMemo((): DynoIntelRadarSnapshot => {
    void localEpoch;
    const records = historyRecords.length > 0 ? historyRecords : loadHistory();
    return {
      scores,
      profile: loadPhysicalProfile(),
      cardioInputs: loadCardioInputs(),
      muscleInputs: loadMuscleInputs(),
      powerInputs: loadPowerInputs(),
      strengthInputs: loadStrengthInputs(),
      gripInputs: loadGripInputs(),
      historyRecords: records,
      liveScoreOverrides,
    };
  }, [historyRecords, liveScoreOverrides, localEpoch, scores]);

  return useMemo(() => () => snapshot, [snapshot]);
}
