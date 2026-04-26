import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { normalizeTwCityDistrictForLadderDataset } from '../logic/core/ladderFilters';
import type { LeaderboardShardId } from '../logic/core/ladderShards';
import type { LeaderboardEntry } from '../services/leaderboardCacheService';
import { listLeaderboard } from '../services/leaderboardService';
import type { EntitlementState } from '../types/entitlement';
import type {
  LadderAgeBucket,
  LadderGender,
  LadderHeightBucket,
  LadderJobCategory,
  LadderRegionScope,
  LadderWeightBucket,
} from '../types/ladderProfile';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';

export interface LadderLeaderboardState {
  items: LeaderboardEntry[];
  loading: boolean;
  error: boolean;
  fromCache: boolean;
  myRank: number | null;
}

export interface LadderLeaderboardFilters {
  gender: LadderGender | 'all';
  ageBucket: LadderAgeBucket | 'all';
  heightBucket: LadderHeightBucket | 'all';
  weightBucket: LadderWeightBucket | 'all';
  jobCategory: LadderJobCategory | 'all';
  regionScope: LadderRegionScope | 'all';
  city: string | 'all';
  district: string | 'all';
}

export function useLadderLeaderboard(
  shardId: LeaderboardShardId,
  filters: LadderLeaderboardFilters
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
  const authUid = useAuthStore((state) => state.uid);

  const applyFilters = useCallback(
    (rows: LeaderboardEntry[]): LeaderboardEntry[] => {
      const { city: normCity, district: normDistrict } = normalizeTwCityDistrictForLadderDataset(
        rows,
        filters.city,
        filters.district
      );
      return rows.filter((row) => {
        if (filters.gender !== 'all' && row.gender !== filters.gender) return false;
        if (filters.ageBucket !== 'all' && row.ageBucket !== filters.ageBucket) return false;
        if (filters.heightBucket !== 'all' && row.heightBucket !== filters.heightBucket) return false;
        if (filters.weightBucket !== 'all' && row.weightBucket !== filters.weightBucket) return false;
        if (filters.jobCategory !== 'all' && row.jobCategory !== filters.jobCategory) return false;
        if (filters.regionScope !== 'all' && row.regionScope !== filters.regionScope) return false;
        if (normCity !== 'all' && row.city !== normCity) return false;
        if (normDistrict !== 'all' && row.district !== normDistrict) return false;
        return true;
      });
    },
    [filters]
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(false);

      const result = await listLeaderboard({
        entitlement,
        metric: shardId,
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

      setItems(applyFilters(result.items ?? []));
      setFromCache(result.fromCache === true);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [shardId, entitlement, filters, applyFilters]);

  const myRank = authUid
    ? items.find((row) => row.uid === authUid)?.rank ?? null
    : null;

  return { items, loading, error, fromCache, myRank };
}
