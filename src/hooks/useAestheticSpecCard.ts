import { useEffect, useMemo, useState } from 'react';
import { parseFfmiBodyFatPctInput } from '../logic/core/ffmiScoring';
import { calculateSixAxisOverall } from '../logic/core/scoring';
import {
  formatAestheticBattleCode,
  isPresentScore,
  parseAestheticBodyFatPct,
  resolveAestheticBodyFatPct,
  resolveAestheticSpec,
} from '../logic/aesthetic/aestheticResolver';
import type { AestheticResolverOutput } from '../logic/aesthetic/aestheticTypes';
import {
  HISTORY_STORAGE_KEY,
  loadArmSizeInputs,
  loadFfmiDraft,
  loadGripInputs,
  loadHistory,
  loadPhysicalProfile,
  subscribeArmSizeInputs,
  subscribeFfmiDraft,
  subscribeGripInputs,
  subscribePhysicalProfile,
} from '../services/localStorageService';
import { useAuthStore } from '../stores/authStore';
import { useMergedScoresFromLocalStores } from './useMergedScoresFromLocalStores';

export interface AestheticSpecCardModel {
  overallScore: number;
  battleCode: string;
  spec: AestheticResolverOutput;
  gender: 'male' | 'female' | null;
  bodyFatPct: number | null;
  /** Present grip axis score for the caliper needle — resolver only exposes titan/peakKg. */
  gripScore: number | null;
}

/**
 * Assembles local-only inputs for the anatomical share card.
 * WHY: Body-fat lives in drafts/history, not PhysicalProfile — keep that cascade out of UI.
 * Uses merged scores directly (not `useCoreSixRadar`) so opening the card cannot double-write widgets.
 */
export function useAestheticSpecCard(): AestheticSpecCardModel {
  const scores = useMergedScoresFromLocalStores();
  const uid = useAuthStore((s) => s.uid);
  const displayName = useAuthStore((s) => s.displayName);
  const [localEpoch, setLocalEpoch] = useState(0);

  useEffect(() => {
    const bump = () => setLocalEpoch((n) => n + 1);
    const unsubP = subscribePhysicalProfile(bump);
    const unsubA = subscribeArmSizeInputs(bump);
    const unsubG = subscribeGripInputs(bump);
    const unsubF = subscribeFfmiDraft(bump);
    const onStorage = (event: StorageEvent) => {
      if (event.key === HISTORY_STORAGE_KEY) bump();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubP();
      unsubA();
      unsubG();
      unsubF();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return useMemo(() => {
    void localEpoch;
    const profile = loadPhysicalProfile();
    const gender =
      profile?.gender === 'female' || profile?.gender === 'male' ? profile.gender : null;
    const latestHistory = loadHistory()[0];
    const bodyFatPct = resolveAestheticBodyFatPct({
      ffmiDraftPct: parseFfmiBodyFatPctInput(loadFfmiDraft()?.bodyFatPctInput),
      armSizePct: parseAestheticBodyFatPct(loadArmSizeInputs()?.bodyFatPct),
      latestHistoryFfmiPct: parseAestheticBodyFatPct(latestHistory?.rawInputs?.ffmi?.bodyFatPct),
    });
    const peakKgRaw = loadGripInputs()?.peakKg;
    const peakKg =
      typeof peakKgRaw === 'number' && Number.isFinite(peakKgRaw) && peakKgRaw > 0
        ? peakKgRaw
        : null;
    const overallScore = calculateSixAxisOverall(scores);

    return {
      overallScore,
      battleCode: formatAestheticBattleCode(displayName, uid),
      gender,
      bodyFatPct,
      gripScore: isPresentScore(scores.gripStrength) ? scores.gripStrength : null,
      spec: resolveAestheticSpec({
        overallScore,
        scores,
        gender,
        bodyFatPct,
        peakKg,
      }),
    };
  }, [displayName, localEpoch, scores, uid]);
}
