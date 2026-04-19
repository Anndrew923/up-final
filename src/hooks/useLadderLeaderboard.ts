import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { EntitlementState } from '../types/entitlement';
import type { SubmitLeaderboardInput } from '../services/leaderboardService';
import { listLeaderboard } from '../services/leaderboardService';
import type { LeaderboardEntry } from '../services/leaderboardCacheService';
import { useEntitlementStore } from '../stores/entitlementStore';

export interface LadderLeaderboardState {
  items: LeaderboardEntry[];
  loading: boolean;
  error: boolean;
  fromCache: boolean;
}

export function useLadderLeaderboard(
  metric: SubmitLeaderboardInput['metric']
): LadderLeaderboardState {
  const entitlement = useEntitlementStore(
    useShallow(
      (s): EntitlementState => ({
        purchaseStatus: s.purchaseStatus,
        subscriptionStatus: s.subscriptionStatus,
        isPro: s.isPro,
        proExpiresAt: s.proExpiresAt,
        planId: s.planId,
        lastCheckedAt: s.lastCheckedAt,
      })
    )
  );

  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(false);

      const result = await listLeaderboard({
        entitlement,
        metric,
        page: 1,
        pageSize: 25,
      });

      if (cancelled) return;

      if (!result.ok) {
        setItems([]);
        setError(true);
        setFromCache(false);
        setLoading(false);
        return;
      }

      setItems(result.items ?? []);
      setFromCache(result.fromCache === true);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [metric, entitlement]);

  return { items, loading, error, fromCache };
}
