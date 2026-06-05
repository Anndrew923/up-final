import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { normalizeLocationFiltersForLadderDataset } from '../logic/core/ladderFilters';
import {
  hasNextLeaderboardPage,
  isLadderProfileFilterActive,
  paginateLeaderboardRowsWithRank,
  resolveLadderFilteredRank,
} from '../logic/core/ladderFilteredRank';
import type { LeaderboardShardId } from '../logic/core/ladderShards';
import type { LeaderboardEntry } from '../services/leaderboardCacheService';
import {
  getMyLeaderboardEntry,
  getRankByScoreBest,
  listLeaderboard,
  listLeaderboardCatalog,
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
import { filterBlockedLeaderboardRows } from '../logic/core/ladderBlockList';
import { useAuthStore } from '../stores/authStore';
import { useLadderBlockStore } from '../stores/ladderBlockStore';
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
  isFilterActive: boolean;
  myFilteredRank: number | null;
  isMeInFilteredList: boolean;
  hasNextPage: boolean;
  /** Filter-mode row count after profile + block filters (for page clamping). */
  filteredRowCount: number;
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
  const [catalogRows, setCatalogRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const catalogLoadedKeyRef = useRef<string | null>(null);
  const authUid = useAuthStore((state) => state.uid);
  const blockedSet = useLadderBlockStore((state) => state.blockedSet);
  const refreshNonce = options?.refreshNonce ?? 0;
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, options?.pageSize ?? 25);

  const isFilterActive = useMemo(() => isLadderProfileFilterActive(filters), [filters]);

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

  const filteredRowsFull = useMemo(() => {
    const source = isFilterActive ? catalogRows : fetchedRows;
    return filterBlockedLeaderboardRows(applyFilters(source), blockedSet);
  }, [isFilterActive, catalogRows, fetchedRows, applyFilters, blockedSet]);

  const items = useMemo(() => {
    if (isFilterActive) {
      return paginateLeaderboardRowsWithRank(filteredRowsFull, page, pageSize);
    }
    return filteredRowsFull;
  }, [isFilterActive, filteredRowsFull, page, pageSize]);

  const { myFilteredRank, isMeInFilteredList } = useMemo(() => {
    if (!isFilterActive) {
      return { myFilteredRank: null, isMeInFilteredList: true };
    }
    return resolveLadderFilteredRank(filteredRowsFull, authUid);
  }, [isFilterActive, filteredRowsFull, authUid]);

  const hasNextPage = useMemo(() => {
    if (isFilterActive) {
      return hasNextLeaderboardPage(filteredRowsFull.length, page, pageSize);
    }
    return fetchedRows.length === pageSize;
  }, [isFilterActive, filteredRowsFull.length, fetchedRows.length, page, pageSize]);

  useEffect(() => {
    let cancelled = false;
    const catalogKey = `${shardId}:${refreshNonce}`;

    if (isFilterActive && catalogLoadedKeyRef.current === catalogKey) {
      return;
    }

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(false);

      if (isFilterActive) {
        const catalogResult = await listLeaderboardCatalog({
          entitlement,
          metric: shardId,
        });
        if (cancelled) return;
        if (!catalogResult.ok) {
          setCatalogRows([]);
          setFetchedRows([]);
          setError(true);
          setFromCache(false);
          catalogLoadedKeyRef.current = null;
          setLoading(false);
          return;
        }
        setCatalogRows(catalogResult.items ?? []);
        catalogLoadedKeyRef.current = catalogKey;
        setFromCache(catalogResult.fromCache === true);
        setLoading(false);
        return;
      }

      catalogLoadedKeyRef.current = null;
      setCatalogRows([]);

      const result = await listLeaderboard({
        entitlement,
        metric: shardId,
        page,
        pageSize,
      });
      if (cancelled) return;

      if (!result.ok) {
        setFetchedRows([]);
        setError(true);
        setFromCache(false);
        setLoading(false);
        return;
      }

      setFetchedRows(result.items ?? []);
      setFromCache(result.fromCache === true);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [shardId, entitlement, refreshNonce, isFilterActive, page, pageSize]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      if (!authUid) {
        setMyEntry(null);
        setMyRank(null);
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
        return;
      }

      const entry = entryResult.item ?? null;
      setMyEntry(entry);
      if (!entry || !Number.isFinite(entry.scoreBest) || entry.scoreBest <= 0) {
        setMyRank(null);
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
        return;
      }
      setMyRank(rankResult.rank ?? null);
    })();

    return () => {
      cancelled = true;
    };
  }, [shardId, entitlement, refreshNonce, authUid]);

  return {
    items,
    datasetItems: isFilterActive ? catalogRows : fetchedRows,
    loading,
    error,
    fromCache,
    page,
    pageSize,
    myEntry,
    myRank,
    isFilterActive,
    myFilteredRank,
    isMeInFilteredList,
    hasNextPage,
    filteredRowCount: filteredRowsFull.length,
  };
}
