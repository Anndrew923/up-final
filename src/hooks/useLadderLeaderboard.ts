import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { normalizeLocationFiltersForLadderDataset } from '../logic/core/ladderFilters';
import type { LeaderboardShardId } from '../logic/core/ladderShards';
import type { LeaderboardEntry } from '../services/leaderboardCacheService';
import {
  getMyLeaderboardEntry,
  getRankByScoreBest,
  listLeaderboard,
} from '../services/leaderboardService';
import type { EntitlementState } from '../types/entitlement';
import type {
  LadderAgeBucket,
  LadderCountryCode,
  LadderGender,
  LadderHeightBucket,
  LadderJobCategory,
  LadderWeightBucket,
} from '../types/ladderProfile';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';

export interface LadderLeaderboardState {
  items: LeaderboardEntry[];
  /** Last successful fetch (pre client-side filters) — for building country/city/district option lists. */
  datasetItems: LeaderboardEntry[];
  loading: boolean;
  error: boolean;
  fromCache: boolean;
  page: number;
  pageSize: number;
  myEntry: LeaderboardEntry | null;
  myRank: number | null;
}

export interface LadderLeaderboardFilters {
  gender: LadderGender | 'all';
  ageBucket: LadderAgeBucket | 'all';
  heightBucket: LadderHeightBucket | 'all';
  weightBucket: LadderWeightBucket | 'all';
  jobCategory: LadderJobCategory | 'all';
  countryCode: LadderCountryCode | 'all';
  city: string | 'all';
  district: string | 'all';
}

export interface UseLadderLeaderboardOptions {
  /** Increment to force a fresh `listLeaderboard` fetch (e.g. after bulk ladder sync). */
  refreshNonce?: number;
  page?: number;
  pageSize?: number;
}

export function useLadderLeaderboard(
  shardId: LeaderboardShardId,
  filters: LadderLeaderboardFilters,
  options?: UseLadderLeaderboardOptions
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

  const [fetchedRows, setFetchedRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const authUid = useAuthStore((state) => state.uid);
  const refreshNonce = options?.refreshNonce ?? 0;
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, options?.pageSize ?? 25);

  const applyFilters = useCallback(
    (rows: LeaderboardEntry[]): LeaderboardEntry[] => {
      const { city: normCity, district: normDistrict } = normalizeLocationFiltersForLadderDataset(
        rows,
        filters.countryCode,
        filters.city,
        filters.district
      );
      return rows.filter((row) => {
        if (filters.gender !== 'all' && row.gender !== filters.gender) return false;
        if (filters.ageBucket !== 'all' && row.ageBucket !== filters.ageBucket) return false;
        if (filters.heightBucket !== 'all' && row.heightBucket !== filters.heightBucket)
          return false;
        if (filters.weightBucket !== 'all' && row.weightBucket !== filters.weightBucket)
          return false;
        if (filters.jobCategory !== 'all' && row.jobCategory !== filters.jobCategory) return false;
        if (filters.countryCode !== 'all' && row.countryCode !== filters.countryCode) return false;
        if (normCity !== 'all' && row.city !== normCity) return false;
        if (normDistrict !== 'all' && row.district !== normDistrict) return false;
        return true;
      });
    },
    [filters]
  );

  const items = useMemo(() => applyFilters(fetchedRows), [fetchedRows, applyFilters]);

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
        page,
        pageSize,
      });

      if (cancelled) return;

      if (!result.ok) {
        setFetchedRows([]);
        setMyEntry(null);
        setMyRank(null);
        setError(true);
        setFromCache(false);
        setLoading(false);
        return;
      }

      setFetchedRows(result.items ?? []);
      setFromCache(result.fromCache === true);

      if (!authUid) {
        setMyEntry(null);
        setMyRank(null);
        setLoading(false);
        return;
      }

      const entryResult = await getMyLeaderboardEntry({
        entitlement,
        metric: shardId,
        uid: authUid,
      });
      if (cancelled) return;
      if (!entryResult.ok) {
        setMyEntry(null);
        setMyRank(null);
        setError(true);
        setLoading(false);
        return;
      }

      const entry = entryResult.item ?? null;
      setMyEntry(entry);
      if (!entry || !Number.isFinite(entry.scoreBest) || entry.scoreBest <= 0) {
        setMyRank(null);
        setLoading(false);
        return;
      }

      const rankResult = await getRankByScoreBest({
        entitlement,
        metric: shardId,
        uid: authUid,
        scoreBest: entry.scoreBest,
      });
      if (cancelled) return;
      if (!rankResult.ok) {
        setMyRank(null);
        setError(true);
        setLoading(false);
        return;
      }
      setMyRank(rankResult.rank ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [shardId, entitlement, refreshNonce, page, pageSize, authUid]);

  return {
    items,
    datasetItems: fetchedRows,
    loading,
    error,
    fromCache,
    page,
    pageSize,
    myEntry,
    myRank,
  };
}
