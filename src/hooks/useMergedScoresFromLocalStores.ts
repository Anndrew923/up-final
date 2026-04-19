import { useEffect, useMemo, useState } from 'react';
import { mergeScoreMapWithResolvedCardio } from '../logic/core/cardioScoring';
import {
  CARDIO_INPUTS_STORAGE_KEY,
  PHYSICAL_PROFILE_STORAGE_KEY,
  loadCardioInputs,
  loadPhysicalProfile,
  subscribeCardioInputs,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import type { ScoreMap } from '../types/scoring';
import { useScoreStore } from '../stores/scoreStore';

/**
 * Zustand scores + local Cooper/5 km inputs + physical profile → same merged map as Home radar.
 * Subscribes to profile/cardio saves and cross-tab `storage` for those keys.
 */
export function useMergedScoresFromLocalStores(): ScoreMap {
  const scores = useScoreStore((s) => s.scores);
  const [localEpoch, setLocalEpoch] = useState(0);

  useEffect(() => {
    const bump = () => setLocalEpoch((n) => n + 1);
    const unsubP = subscribePhysicalProfile(bump);
    const unsubC = subscribeCardioInputs(bump);

    const onStorage = (e: StorageEvent) => {
      const k = e.key;
      if (
        k !== null &&
        k !== CARDIO_INPUTS_STORAGE_KEY &&
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
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return useMemo(() => {
    void localEpoch;
    return mergeScoreMapWithResolvedCardio(scores, loadPhysicalProfile(), loadCardioInputs());
  }, [scores, localEpoch]);
}
