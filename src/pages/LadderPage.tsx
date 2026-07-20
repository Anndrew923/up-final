import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LadderUserPreviewModal from '../components/ladder/LadderUserPreviewModal';
import LadderFloatingRankBar from '../components/ladder/LadderFloatingRankBar';
import LeaderboardSyncAllBar from '../components/ladder/LeaderboardSyncAllBar';
import LadderFilterSheet from '../components/ladder/LadderFilterSheet';
import LadderGenesisEarlyBirdModal from '../components/ladder/LadderGenesisEarlyBirdModal';
import { MONETIZATION_CONFIG } from '../config/monetization';
import { joinArenaPath } from '../lib/joinArenaNavigation';
import { shouldShowLadderGenesisEarlyBird } from '../services/ladderGenesisPrefService';
import { useDopamineFeedback } from '../hooks/useDopamineFeedback';
import { useLadderFilterSheetOptions } from '../hooks/useLadderFilterSheetOptions';
import { isLadderCountryCode, type LadderCountryCode } from '../types/ladderProfile';
import { useLadderLeaderboard } from '../hooks/useLadderLeaderboard';
import { useLeaderboardAccess } from '../hooks/useLeaderboardAccess';
import { useLadderFiltersDraft } from '../hooks/useLadderFiltersDraft';
import {
  resolveEffectiveLadderCityFilter,
  resolveEffectiveLadderDistrictFilter,
} from '../logic/core/ladderFilters';
import {
  divisionUsesProjectFilter,
  getLeaderboardShardId,
  getProjectOptionsForDivision,
  type LeaderboardShardId,
} from '../logic/core/ladderShards';
import {
  resolveLadderEffectiveRank,
  resolveLadderJumpTargetPage,
  resolveLeaderboardMaxPage,
  shouldShowLadderFloatingRankBar,
} from '../logic/core/ladderFilteredRank';
import { detectPromotion } from '../logic/core/leaderboardProgress';
import { useLeaderboardCeremonyStore } from '../stores/leaderboardCeremonyStore';
import { useAuthStore } from '../stores/authStore';
import { useLadderBlockStore } from '../stores/ladderBlockStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import {
  buildLadderUserPreviewFromEntry,
  getLadderUserPreview,
  type LadderUserPreview,
} from '../services/leaderboardPreviewService';
import type { LeaderboardEntry } from '../services/leaderboardCacheService';
import { LADDER_CACHE_INVALIDATED_EVENT } from '../services/ladderSyncPostBatch';
import { sanitizeAvatarUrlForLeaderboard } from '../services/ladderIdentityService';
import { useShallow } from 'zustand/react/shallow';
import type { EntitlementState } from '../types/entitlement';

function formatLeaderboardRowScore(
  shardId: LeaderboardShardId,
  scoreBest: number,
  t: TFunction
): string {
  if (!Number.isFinite(scoreBest)) return '—';
  if (shardId === 'strength') {
    return t('ladder.rowScoreStrengthKg', { ns: 'common', kg: scoreBest.toFixed(1) });
  }
  if (shardId === 'strength_totalFive') {
    return scoreBest.toFixed(2);
  }
  return String(scoreBest);
}

function formatCompactUpdatedAt(updatedAt: string): string {
  const ts = new Date(updatedAt).getTime();
  if (!Number.isFinite(ts)) return '--';
  const now = Date.now();
  const diffMs = Math.max(0, now - ts);
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}d`;
  const date = new Date(ts);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  return `${month}/${dayOfMonth}`;
}

/**
 * Leaderboard arena — loads rankings via `leaderboardService` (Firestore when configured).
 * Non-eligible users redirect before any leaderboard I/O.
 */
export default function LadderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEnter } = useLeaderboardAccess();
  const { triggerRankUpCombo } = useDopamineFeedback();
  const queuePromotion = useLeaderboardCeremonyStore((state) => state.queuePromotion);
  const clearPromotion = useLeaderboardCeremonyStore((state) => state.clearPromotion);
  const promotionBanner = useLeaderboardCeremonyStore((state) => state.pendingPromotion);
  const [ladderRefreshNonce, setLadderRefreshNonce] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [genesisModalOpen, setGenesisModalOpen] = useState(false);
  const pageSize = 25;
  const previousRankRef = useRef<number | null>(null);
  const pendingScrollUidRef = useRef<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const authUid = useAuthStore((state) => state.uid);
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
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [previewUser, setPreviewUser] = useState<LadderUserPreview | null>(null);
  const [previewEntryScoreBest, setPreviewEntryScoreBest] = useState<number | null>(null);
  const [previewEntryFallback, setPreviewEntryFallback] = useState(false);
  const previewRequestIdRef = useRef(0);
  const [myRowInViewport, setMyRowInViewport] = useState(false);
  /** WHY: IO uses the full window rect; at scrollY≈0 ranks 8–9 can sit behind BottomNav but still "intersect". */
  const [isAtTop, setIsAtTop] = useState(true);

  const hydrateBlockedUids = useLadderBlockStore((s) => s.hydrate);

  const bumpLadderRefresh = useCallback(() => {
    setLadderRefreshNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    hydrateBlockedUids();
  }, [hydrateBlockedUids]);

  useEffect(() => {
    const onCacheInvalidated = () => bumpLadderRefresh();
    window.addEventListener(LADDER_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    return () => window.removeEventListener(LADDER_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
  }, [bumpLadderRefresh]);

  const {
    applied,
    draft,
    sheetOpen,
    openSheet,
    closeSheet,
    hasUnappliedChanges,
    activeAppliedFilterCount,
    draftProjectControlValue,
    appliedProjectControlValue,
    setDraftDivision,
    setDraftProject,
    setDraftGender,
    setDraftAgeBucket,
    setDraftHeightBucket,
    setDraftWeightBucket,
    setDraftJobCategory,
    setDraftCountryCode,
    setDraftCity,
    setDraftDistrict,
    clearDraftFilters,
    applyDraft,
  } = useLadderFiltersDraft({
    onAppliedChange: () => {
      setCurrentPage(1);
    },
  });

  const projectSheetOptions = useMemo(() => {
    if (!divisionUsesProjectFilter(draft.division)) return [];
    return getProjectOptionsForDivision(draft.division).map((o) => ({
      value: o.value,
      label: t(o.labelKey, { ns: 'common' }),
    }));
  }, [draft.division, t]);

  /** Align Firestore shard with the sub-ranking `<select>` (resolved default when state is still `__none__`). */
  const shardProjectParam = divisionUsesProjectFilter(applied.division)
    ? appliedProjectControlValue
    : applied.filterProject;

  const shardId = useMemo(
    () => getLeaderboardShardId(applied.division, shardProjectParam),
    [applied.division, shardProjectParam]
  );

  /** Must be declared before `useLadderLeaderboard` — passing it earlier hits TDZ (`const` not initialized). */
  const initialFilters = useMemo(
    () => ({
      gender: applied.gender,
      ageBucket: applied.ageBucket,
      heightBucket: applied.heightBucket,
      weightBucket: applied.weightBucket,
      jobCategory: applied.jobCategory,
      countryCode: applied.countryCode,
      city: applied.city,
      district: applied.district,
    }),
    [applied]
  );

  const {
    items,
    datasetItems,
    loading,
    error,
    myEntry,
    myRank,
    isFilterActive,
    myFilteredRank,
    isMeInFilteredList,
    hasNextPage,
    filteredRowCount,
  } = useLadderLeaderboard(shardId, initialFilters, {
    refreshNonce: ladderRefreshNonce,
    page: currentPage,
    pageSize,
  });

  useEffect(() => {
    previousRankRef.current = null;
  }, [shardId]);

  useEffect(() => {
    if (!pendingScrollUidRef.current || loading) return;
    const pendingUid = pendingScrollUidRef.current;
    let attempts = 0;

    const tryScroll = () => {
      const target = rowRefs.current.get(pendingUid);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        pendingScrollUidRef.current = null;
        return;
      }
      if (attempts >= 4) {
        pendingScrollUidRef.current = null;
        return;
      }
      attempts += 1;
      requestAnimationFrame(tryScroll);
    };

    tryScroll();
  }, [items, loading]);

  useEffect(() => {
    if (!isFilterActive || loading) return;
    const maxPage = resolveLeaderboardMaxPage(filteredRowCount, pageSize);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [isFilterActive, loading, filteredRowCount, currentPage, pageSize]);

  useEffect(() => {
    const AT_TOP_THRESHOLD_PX = 8;
    const syncAtTop = () => {
      setIsAtTop(window.scrollY <= AT_TOP_THRESHOLD_PX);
    };
    syncAtTop();
    window.addEventListener('scroll', syncAtTop, { passive: true });
    return () => window.removeEventListener('scroll', syncAtTop);
  }, []);

  /**
   * WHY: Rank may live on the current page but below the fold (e.g. #9 on page 1).
   * rootMargin shrinks the root so rows behind BottomNav + safe-area are not "visible".
   */
  useEffect(() => {
    if (!authUid || loading) {
      setMyRowInViewport(false);
      return;
    }
    const el = rowRefs.current.get(authUid);
    if (!el) {
      setMyRowInViewport(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setMyRowInViewport(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px',
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [authUid, items, loading, currentPage]);

  const effectiveTopGuardRank = resolveLadderEffectiveRank({
    isFilterActive,
    isMeInFilteredList,
    myFilteredRank,
    myRank,
  });
  const forceFloatingBarAtTop =
    isAtTop && effectiveTopGuardRank !== null && effectiveTopGuardRank > 8;

  const countryCodesInDataset = useMemo(() => {
    const next = new Set<LadderCountryCode>();
    for (const row of datasetItems) {
      if (isLadderCountryCode(row.countryCode)) next.add(row.countryCode);
    }
    return [...next].sort((a, b) => a.localeCompare(b));
  }, [datasetItems]);

  const locationRows = useMemo(() => {
    if (draft.countryCode === 'all') return [];
    return datasetItems.filter((row) => row.countryCode === draft.countryCode);
  }, [datasetItems, draft.countryCode]);

  const cityOptions = useMemo(() => {
    if (draft.countryCode === 'all') return [];
    return Array.from(
      new Set(locationRows.map((row) => row.city).filter((x): x is string => Boolean(x)))
    ).sort((a, b) => a.localeCompare(b));
  }, [locationRows, draft.countryCode]);

  const effectiveCityFilter = useMemo(
    () => resolveEffectiveLadderCityFilter(draft.city, cityOptions),
    [draft.city, cityOptions]
  );

  const districtOptions = useMemo(() => {
    if (draft.countryCode === 'all') return [];
    const base =
      effectiveCityFilter === 'all'
        ? locationRows
        : locationRows.filter((row) => row.city === effectiveCityFilter);
    return Array.from(
      new Set(base.map((row) => row.district).filter((x): x is string => Boolean(x)))
    ).sort((a, b) => a.localeCompare(b));
  }, [locationRows, effectiveCityFilter, draft.countryCode]);

  const effectiveDistrictFilter = useMemo(
    () => resolveEffectiveLadderDistrictFilter(draft.district, districtOptions),
    [draft.district, districtOptions]
  );

  const {
    genderOptions,
    ageBucketOptions,
    heightBucketOptions,
    weightBucketOptions,
    jobCategoryOptions,
    countrySelectOptions,
    twCitySelectOptions,
    twDistrictSelectOptions,
  } = useLadderFilterSheetOptions(cityOptions, districtOptions, {
    countryCodes: countryCodesInDataset,
    locationLabelsTw: draft.countryCode === 'TW',
  });

  useEffect(() => {
    if (!canEnter) {
      navigate(joinArenaPath('ladder'), { replace: true });
    }
  }, [canEnter, navigate]);

  // WHY: Genesis early-bird announcement on first ladder entry during open-access era.
  useEffect(() => {
    if (!canEnter) return;
    if (MONETIZATION_CONFIG.leaderboardPaywallEnabled) return;
    if (!shouldShowLadderGenesisEarlyBird()) return;
    setGenesisModalOpen(true);
  }, [canEnter]);

  useEffect(() => {
    const event = detectPromotion(previousRankRef.current, myRank);
    previousRankRef.current = myRank;
    if (!event) return;
    queuePromotion(event);
  }, [myRank, queuePromotion]);

  useEffect(() => {
    if (!promotionBanner) return;
    triggerRankUpCombo();
    const timer = window.setTimeout(() => {
      clearPromotion();
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [promotionBanner, triggerRankUpCombo, clearPromotion]);

  const formatFloatingScore = useCallback(
    (metric: LeaderboardShardId, scoreBest: number) =>
      formatLeaderboardRowScore(metric, scoreBest, t),
    [t]
  );

  const jumpToMyRow = useCallback(() => {
    if (!authUid) return;

    const jumpRank = resolveLadderEffectiveRank({
      isFilterActive,
      isMeInFilteredList,
      myFilteredRank,
      myRank,
    });
    if (jumpRank === null) return;

    const targetPage = resolveLadderJumpTargetPage(jumpRank, pageSize);
    if (targetPage === currentPage) {
      requestAnimationFrame(() => {
        rowRefs.current.get(authUid)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    pendingScrollUidRef.current = authUid;
    setCurrentPage(targetPage);
  }, [authUid, isFilterActive, isMeInFilteredList, myFilteredRank, myRank, pageSize, currentPage]);

  const closePreviewModal = useCallback(() => {
    previewRequestIdRef.current += 1;
    setPreviewOpen(false);
    setSelectedUid(null);
    setPreviewLoading(false);
    setPreviewError(false);
    setPreviewUser(null);
    setPreviewEntryScoreBest(null);
    setPreviewEntryFallback(false);
  }, []);

  const handleOpenUserPreview = useCallback(
    async (uid: string, anonymous: boolean, entryScoreBest?: number, row?: LeaderboardEntry) => {
      if (!uid || anonymous) return;
      const requestId = previewRequestIdRef.current + 1;
      previewRequestIdRef.current = requestId;
      setSelectedUid(uid);
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreviewError(false);
      setPreviewEntryFallback(false);
      setPreviewUser(null);
      setPreviewEntryScoreBest(
        entryScoreBest != null && Number.isFinite(entryScoreBest) ? entryScoreBest : null
      );

      const result = await getLadderUserPreview({ entitlement, uid });
      if (previewRequestIdRef.current !== requestId) return;
      if (!result.ok || !result.item) {
        if (result.reason === 'not-found' && row) {
          setPreviewUser(buildLadderUserPreviewFromEntry(row));
          setPreviewEntryFallback(true);
          setPreviewLoading(false);
          return;
        }
        setPreviewLoading(false);
        setPreviewError(true);
        return;
      }
      setPreviewUser(result.item);
      setPreviewLoading(false);
    },
    [entitlement]
  );

  const floatingAvatarUrl = useMemo(() => {
    if (!myEntry || myEntry.isAnonymousInLadder === true) return undefined;
    return sanitizeAvatarUrlForLeaderboard(myEntry.avatarUrl);
  }, [myEntry]);

  const floatingDisplayName = useMemo(() => {
    if (!myEntry) return '';
    if (myEntry.isAnonymousInLadder === true) {
      return t('ladder.anonymousName', { ns: 'common' });
    }
    return myEntry.displayName?.trim() || authUid || '';
  }, [myEntry, authUid, t]);

  const showFloatingRankBar = shouldShowLadderFloatingRankBar({
    myRank,
    myEntry,
    isFilterActive,
    isMeInFilteredList,
    forceFloatingBarAtTop,
    myRowInViewport,
  });

  const canPrevPage = currentPage > 1;
  const canNextPage = hasNextPage;

  if (!canEnter) {
    return (
      <main className="ui-shell max-w-xl">
        <p className="text-sm text-zinc-500">{t('ladder.redirecting', { ns: 'common' })}</p>
      </main>
    );
  }

  return (
    <main className="ui-shell-compact relative z-10 max-w-3xl space-y-4 bg-[#090b0e] pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay [transform:translateZ(0)]"
          style={{
            backgroundImage: `
            linear-gradient(to right, #22d3ee 1px, transparent 1px),
            linear-gradient(to bottom, #22d3ee 1px, transparent 1px)
          `,
            backgroundSize: '24px 24px',
          }}
        />
        {/*
          Arena atmosphere (WHY): Large negative-top blurs used to read as a tall “HUD glass” band
          under the fixed icons. Keep glow below the title card — do not bleed into shell-top/HUD.
        */}
        <div className="absolute left-[-8%] top-[20%] h-[26vh] max-h-52 w-[62vw] rounded-full bg-cyan-500/10 blur-[72px] [transform:translateZ(0)]" />
        <div className="absolute right-[-12%] top-[28%] h-[32vh] max-h-60 w-[55vw] rounded-full bg-amber-500/5 blur-[80px] [transform:translateZ(0)]" />
      </div>

      <div className="sticky top-shell-top-compact z-20 shrink-0 -mx-1 sm:-mx-0">
        <div className="ui-card relative overflow-hidden border border-slate-800/70 bg-slate-900/45 py-2 backdrop-blur-md shadow-lg shadow-black/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="h-6 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-600 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              <div className="flex min-w-0 flex-col">
                <h1 className="truncate bg-gradient-to-r from-zinc-50 via-slate-100 to-slate-300 bg-clip-text text-xl font-black tracking-wide text-transparent md:text-2xl">
                  {t('ladder.title', { ns: 'common' })}
                </h1>
                <span className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-400/60">
                  {t('ladder.liveSubtitle', { ns: 'common' })}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-xl border border-slate-700/60 bg-slate-800/45 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-300 transition-all duration-200 hover:border-cyan-500/45 hover:text-cyan-300 active:scale-95"
              onClick={openSheet}
            >
              {t('ladder.moreFilters', { ns: 'common' })}
              {activeAppliedFilterCount > 0 ? (
                <span className="ml-1.5 rounded-full border border-cyan-400/50 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.25)]">
                  {activeAppliedFilterCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
      <LadderFilterSheet
        open={sheetOpen}
        values={{ ...draft, filterProject: draftProjectControlValue }}
        activeFilterCount={activeAppliedFilterCount}
        hasUnappliedChanges={hasUnappliedChanges}
        projectOptions={projectSheetOptions}
        genderOptions={genderOptions}
        ageBucketOptions={ageBucketOptions}
        heightBucketOptions={heightBucketOptions}
        weightBucketOptions={weightBucketOptions}
        jobCategoryOptions={jobCategoryOptions}
        countrySelectOptions={countrySelectOptions}
        citySelectOptions={twCitySelectOptions}
        districtSelectOptions={twDistrictSelectOptions}
        effectiveCityValue={effectiveCityFilter}
        effectiveDistrictValue={effectiveDistrictFilter}
        syncAllSlot={<LeaderboardSyncAllBar showSectionTitle onFinished={bumpLadderRefresh} />}
        onClose={closeSheet}
        onApply={applyDraft}
        onClear={clearDraftFilters}
        onDivisionChange={setDraftDivision}
        onProjectChange={setDraftProject}
        onGenderChange={setDraftGender}
        onAgeBucketChange={setDraftAgeBucket}
        onHeightBucketChange={setDraftHeightBucket}
        onWeightBucketChange={setDraftWeightBucket}
        onJobCategoryChange={setDraftJobCategory}
        onCountryCodeChange={(next) => {
          if (next === 'all') {
            setDraftCountryCode('all');
            return;
          }
          setDraftCountryCode(isLadderCountryCode(next) ? next : 'all');
        }}
        onCityChange={setDraftCity}
        onDistrictChange={setDraftDistrict}
      />

      {promotionBanner ? (
        <section className="rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          <p className="font-semibold">
            {t('ladder.promotion.title', {
              ns: 'common',
              delta: promotionBanner.delta,
            })}
          </p>
          <p className="mt-0.5 text-[11px] text-amber-200/90">
            {promotionBanner.milestone
              ? t('ladder.promotion.milestone', {
                  ns: 'common',
                  milestone: promotionBanner.milestone,
                })
              : t('ladder.promotion.current', {
                  ns: 'common',
                  rank: promotionBanner.currentRank,
                })}
          </p>
        </section>
      ) : null}

      <section className="ui-card relative z-0 min-h-[50vh] border border-slate-800/70 bg-gradient-to-b from-slate-900/70 to-slate-950/80 shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent" />
        <header className="space-y-1.5 pb-3 pt-0.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-info">
            {t('ladder.rankings.kicker', { ns: 'common' })}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            {t('ladder.rankings.title', { ns: 'common' })}
          </h2>
        </header>

        {loading ? (
          <div className="space-y-3 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg border border-zinc-800/80 bg-zinc-900/50"
              />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-4 text-sm text-rose-300">
            {t('ladder.loadError', { ns: 'common' })}
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-zinc-700/90 bg-zinc-900/40 px-4 py-6 text-center text-sm leading-relaxed text-zinc-400">
            {t('ladder.empty', { ns: 'common' })}
          </p>
        ) : (
          <ul className="space-y-2 pt-1">
            {items.map((row, index) => {
              const rank = row.rank ?? index + 1;
              const isRank1 = rank === 1;
              const isRank2 = rank === 2;
              const isRank3 = rank === 3;
              const isMe = row.uid === authUid;
              const isAnonymousRow = row.isAnonymousInLadder === true;
              const displayName = isAnonymousRow
                ? t('ladder.anonymousName', { ns: 'common' })
                : row.displayName || row.uid;
              const secondaryLine = isAnonymousRow
                ? t('ladder.anonymousIdLabel', { ns: 'common' })
                : row.uid;
              const rowTierClass = isRank1
                ? 'bg-gradient-to-r from-amber-500/10 to-bg-panel/40 border-l-4 border-l-amber-500 border-y border-r border-y-amber-500/20 border-r-amber-500/20'
                : isRank2
                  ? 'bg-gradient-to-r from-slate-300/10 to-bg-panel/40 border-l-4 border-l-slate-300 border-y border-r border-y-slate-300/20 border-r-slate-300/20'
                  : isRank3
                    ? 'bg-gradient-to-r from-orange-500/10 to-bg-panel/40 border-l-4 border-l-orange-500 border-y border-r border-y-orange-500/20 border-r-orange-500/20'
                    : 'bg-zinc-900/40 border-l-2 border-l-zinc-700 border-y border-r border-zinc-800/80 hover:bg-zinc-800/60';
              const meHighlightClass = isMe
                ? 'ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.15)] z-10'
                : '';
              const rankClass = isRank1
                ? 'text-amber-400 font-bold drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] text-xs sm:text-sm'
                : isRank2
                  ? 'text-slate-300 font-bold text-xs sm:text-sm'
                  : isRank3
                    ? 'text-orange-400 font-bold text-xs sm:text-sm'
                    : 'text-zinc-500 font-medium text-[11px] sm:text-xs';
              const scoreClass = isRank1
                ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]'
                : 'text-accent-primary group-hover:text-cyan-300';
              const compactUpdatedAt = formatCompactUpdatedAt(row.updatedAt);
              return (
                <li
                  key={row.uid}
                  ref={(el) => {
                    if (!el) {
                      rowRefs.current.delete(row.uid);
                      return;
                    }
                    rowRefs.current.set(row.uid, el);
                  }}
                  className="list-none"
                >
                  <button
                    type="button"
                    disabled={isAnonymousRow}
                    onClick={() => {
                      void handleOpenUserPreview(row.uid, isAnonymousRow, row.scoreBest, row);
                    }}
                    className={`group relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-md px-3 py-3 text-left text-sm transition-all duration-200 sm:gap-4 sm:px-4 ${rowTierClass} ${meHighlightClass} disabled:cursor-not-allowed disabled:opacity-90`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                      <span
                        className={`shrink-0 w-7 text-center font-mono sm:w-10 sm:text-left ${rankClass}`}
                      >
                        {isRank1 ? `✦ #${rank}` : `#${rank}`}
                      </span>
                      {!isAnonymousRow && row.avatarUrl ? (
                        <img
                          src={row.avatarUrl}
                          alt=""
                          aria-hidden
                          className="h-8 w-8 shrink-0 rounded-full border border-zinc-700 object-cover sm:h-10 sm:w-10"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p
                          className={`truncate font-medium text-zinc-100 ${isAnonymousRow ? 'italic opacity-70' : ''}`}
                        >
                          {displayName}
                        </p>
                        <p
                          className={`hidden truncate text-[10px] uppercase sm:block ${
                            isAnonymousRow
                              ? 'font-mono tracking-widest text-zinc-600'
                              : 'tracking-widest text-zinc-500'
                          }`}
                        >
                          {secondaryLine}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 min-w-[56px] text-right sm:min-w-[84px]">
                      <p
                        className={`font-mono text-xs font-semibold tabular-nums transition-colors duration-200 sm:text-base ${scoreClass}`}
                      >
                        {formatLeaderboardRowScore(shardId, row.scoreBest, t)}
                      </p>
                      <p
                        className="hidden text-[10px] text-zinc-500 sm:block"
                        title={new Date(row.updatedAt).toLocaleString()}
                      >
                        {compactUpdatedAt}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
          <button
            type="button"
            className="ui-btn py-1.5 text-xs disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={!canPrevPage || loading}
          >
            {t('ladder.pagination.prev', { ns: 'common' })}
          </button>
          <p className="font-mono text-[11px] text-zinc-500">
            {t('ladder.pagination.page', { ns: 'common', page: currentPage })}
          </p>
          <button
            type="button"
            className="ui-btn py-1.5 text-xs disabled:opacity-50"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!canNextPage || loading}
          >
            {t('ladder.pagination.next', { ns: 'common' })}
          </button>
        </footer>
      </section>
      {showFloatingRankBar && myEntry && myRank !== null ? (
        <LadderFloatingRankBar
          shardId={shardId}
          myRank={myRank}
          myScore={myEntry.scoreBest}
          avatarUrl={floatingAvatarUrl}
          displayName={floatingDisplayName}
          isAnonymous={myEntry.isAnonymousInLadder === true}
          isFilterActive={isFilterActive}
          myFilteredRank={myFilteredRank}
          isMeInFilteredList={isMeInFilteredList}
          onJumpToMyRow={jumpToMyRow}
          formatScore={formatFloatingScore}
        />
      ) : null}
      <LadderUserPreviewModal
        open={previewOpen}
        loading={previewLoading}
        error={previewError}
        user={previewUser}
        entryFallback={previewEntryFallback}
        targetUid={selectedUid}
        viewerUid={authUid}
        viewingShardId={shardId}
        ladderEntryScoreBest={previewEntryScoreBest}
        onClose={closePreviewModal}
        onBlocked={bumpLadderRefresh}
      />
      <LadderGenesisEarlyBirdModal
        open={genesisModalOpen}
        onEnter={() => setGenesisModalOpen(false)}
      />
    </main>
  );
}
