import { useEffect, useState } from 'react';
import { MONETIZATION_CONFIG } from '../config/monetization';
import {
  buildGenesisSeatEarlyFallback,
  buildGenesisSeatEndedSummary,
  type GenesisSeatPublicSummary,
} from '../logic/core/genesisSeatSummary';
import { fetchGenesisSeatSummary } from '../services/genesisSeatSummaryService';
import { useAuthStore } from '../stores/authStore';

function resolveBootstrapSummary(): GenesisSeatPublicSummary {
  if (MONETIZATION_CONFIG.leaderboardPaywallEnabled) {
    return buildGenesisSeatEndedSummary(MONETIZATION_CONFIG.genesisEarlyBirdSeatLimit);
  }
  return buildGenesisSeatEarlyFallback(MONETIZATION_CONFIG.genesisEarlyBirdSeatLimit);
}

/**
 * Global singleton genesis FOMO summary for ladder / join-arena surfaces.
 * WHY: Default to early static copy so cold-start UI never waits on Firestore;
 * signed-in users refresh once per stage TTL (shard-agnostic).
 */
export function useGenesisSeatSummary(): GenesisSeatPublicSummary {
  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const uid = useAuthStore((s) => s.uid);
  const [summary, setSummary] = useState<GenesisSeatPublicSummary>(resolveBootstrapSummary);

  useEffect(() => {
    let cancelled = false;

    if (MONETIZATION_CONFIG.leaderboardPaywallEnabled) {
      setSummary(buildGenesisSeatEndedSummary(MONETIZATION_CONFIG.genesisEarlyBirdSeatLimit));
      return;
    }

    if (authStatus === 'loading') return;

    if (authStatus !== 'signed-in' || isAnonymous || !uid) {
      setSummary(buildGenesisSeatEarlyFallback(MONETIZATION_CONFIG.genesisEarlyBirdSeatLimit));
      return;
    }

    void fetchGenesisSeatSummary().then((next) => {
      if (!cancelled) setSummary(next);
    });

    return () => {
      cancelled = true;
    };
  }, [authStatus, isAnonymous, uid]);

  return summary;
}
