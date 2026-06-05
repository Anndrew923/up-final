import type {
  LadderAgeBucket,
  LadderCountryCode,
  LadderGender,
  LadderHeightBucket,
  LadderJobCategory,
  LadderWeightBucket,
} from '../../types/ladderProfile';

export interface LadderProfileFilterShape {
  gender: LadderGender | 'all';
  ageBucket: LadderAgeBucket | 'all';
  heightBucket: LadderHeightBucket | 'all';
  weightBucket: LadderWeightBucket | 'all';
  jobCategory: LadderJobCategory | 'all';
  countryCode: LadderCountryCode | 'all';
  city: string | 'all';
  district: string | 'all';
}

export interface LadderFilteredRankState {
  myFilteredRank: number | null;
  isMeInFilteredList: boolean;
}

/** Profile funnel only — shard/division switches are separate navigation axes. */
export function isLadderProfileFilterActive(filters: LadderProfileFilterShape): boolean {
  return (
    filters.gender !== 'all' ||
    filters.ageBucket !== 'all' ||
    filters.heightBucket !== 'all' ||
    filters.weightBucket !== 'all' ||
    filters.jobCategory !== 'all' ||
    filters.countryCode !== 'all' ||
    filters.city !== 'all' ||
    filters.district !== 'all'
  );
}

export function resolveLadderFilteredRank(
  rows: readonly { uid: string }[],
  authUid: string | null | undefined
): LadderFilteredRankState {
  if (!authUid) {
    return { myFilteredRank: null, isMeInFilteredList: false };
  }
  const index = rows.findIndex((row) => row.uid === authUid);
  if (index < 0) {
    return { myFilteredRank: null, isMeInFilteredList: false };
  }
  return { myFilteredRank: index + 1, isMeInFilteredList: true };
}

export function paginateLeaderboardRowsWithRank<T extends { uid: string }>(
  rows: readonly T[],
  page: number,
  pageSize: number
): (T & { rank: number })[] {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;
  return rows.slice(start, start + safePageSize).map((item, index) => ({
    ...item,
    rank: start + index + 1,
  }));
}

export function hasNextLeaderboardPage(
  totalRows: number,
  page: number,
  pageSize: number
): boolean {
  return Math.max(1, page) * Math.max(1, pageSize) < totalRows;
}

export function resolveLeaderboardMaxPage(totalRows: number, pageSize: number): number {
  if (totalRows <= 0) return 1;
  return Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
}

/** Jump + top-guard use filtered rank only when the user is present in the active sub-list. */
export function resolveLadderEffectiveRank(params: {
  isFilterActive: boolean;
  isMeInFilteredList: boolean;
  myFilteredRank: number | null;
  myRank: number | null;
}): number | null {
  if (params.isFilterActive) {
    if (!params.isMeInFilteredList) return null;
    if (params.myFilteredRank === null || params.myFilteredRank <= 0) return null;
    return params.myFilteredRank;
  }
  if (params.myRank === null || params.myRank <= 0) return null;
  return params.myRank;
}

export function resolveLadderJumpTargetPage(rank: number, pageSize: number): number {
  return Math.max(1, Math.ceil(rank / Math.max(1, pageSize)));
}

export function shouldShowLadderFloatingRankBar(params: {
  myRank: number | null;
  myEntry: { scoreBest: number } | null;
  isFilterActive: boolean;
  isMeInFilteredList: boolean;
  forceFloatingBarAtTop: boolean;
  myRowInViewport: boolean;
}): boolean {
  const hasScoredEntry =
    params.myRank !== null &&
    params.myRank > 0 &&
    params.myEntry !== null &&
    Number.isFinite(params.myEntry.scoreBest) &&
    params.myEntry.scoreBest > 0;

  if (!hasScoredEntry) return false;
  if (params.isFilterActive && !params.isMeInFilteredList) return true;
  return params.forceFloatingBarAtTop || !params.myRowInViewport;
}
