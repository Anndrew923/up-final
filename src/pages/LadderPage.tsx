import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OptionSelectSheet from '../components/home/OptionSelectSheet';
import LadderUserPreviewModal from '../components/ladder/LadderUserPreviewModal';
import LadderFloatingRankBar from '../components/ladder/LadderFloatingRankBar';
import LeaderboardSyncAllBar from '../components/ladder/LeaderboardSyncAllBar';
import { ROUTES } from '../config/routes';
import { useDopamineFeedback } from '../hooks/useDopamineFeedback';
import { useLadderFilterSheetOptions } from '../hooks/useLadderFilterSheetOptions';
import { isLadderCountryCode, type LadderCountryCode } from '../types/ladderProfile';
import { useLadderLeaderboard } from '../hooks/useLadderLeaderboard';
import { useLeaderboardAccess } from '../hooks/useLeaderboardAccess';
import { resolveEffectiveLadderCityFilter, resolveEffectiveLadderDistrictFilter } from '../logic/core/ladderFilters';
import {
  divisionUsesProjectFilter,
  getDefaultProjectForDivision,
  getLeaderboardShardId,
  getProjectOptionsForDivision,
  LADDER_DIVISION_IDS,
  LADDER_PROJECT_NONE,
  type LadderDivisionId,
  type LeaderboardShardId,
} from '../logic/core/ladderShards';
import { detectPromotion } from '../logic/core/leaderboardProgress';
import { useLeaderboardCeremonyStore } from '../stores/leaderboardCeremonyStore';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import type { LadderAgeBucket, LadderHeightBucket, LadderJobCategory, LadderWeightBucket } from '../types/ladderProfile';
import { getLadderUserPreview, type LadderUserPreview } from '../services/leaderboardPreviewService';
import { useShallow } from 'zustand/react/shallow';
import type { EntitlementState } from '../types/entitlement';

function formatLeaderboardRowScore(shardId: LeaderboardShardId, scoreBest: number, t: TFunction): string {
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
  const [division, setDivision] = useState<LadderDivisionId>('ladderScore');
  const [filterProject, setFilterProject] = useState<string>(() => getDefaultProjectForDivision('ladderScore'));
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [ageBucketFilter, setAgeBucketFilter] = useState<LadderAgeBucket | 'all'>('all');
  const [heightBucketFilter, setHeightBucketFilter] = useState<LadderHeightBucket | 'all'>('all');
  const [weightBucketFilter, setWeightBucketFilter] = useState<LadderWeightBucket | 'all'>('all');
  const [jobCategoryFilter, setJobCategoryFilter] = useState<LadderJobCategory | 'all'>('all');
  const [countryCodeFilter, setCountryCodeFilter] = useState<'all' | LadderCountryCode>('all');
  const [cityFilter, setCityFilter] = useState<string | 'all'>('all');
  const [districtFilter, setDistrictFilter] = useState<string | 'all'>('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [ladderRefreshNonce, setLadderRefreshNonce] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isNearTop, setIsNearTop] = useState(true);
  const pageSize = 25;
  const previousRankRef = useRef<number | null>(null);
  const pendingScrollUidRef = useRef<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const expandedFiltersPanelId = useId();
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
  const previewRequestIdRef = useRef(0);

  const bumpLadderRefresh = useCallback(() => {
    setLadderRefreshNonce((n) => n + 1);
  }, []);

  const selectDivision = useCallback((next: LadderDivisionId) => {
    setDivision(next);
    setFilterProject(getDefaultProjectForDivision(next));
    setCurrentPage(1);
  }, []);

  const projectSheetOptions = useMemo(() => {
    if (!divisionUsesProjectFilter(division)) return [];
    return getProjectOptionsForDivision(division).map((o) => ({
      value: o.value,
      label: t(o.labelKey, { ns: 'common' }),
    }));
  }, [division, t]);

  const projectControlValue = useMemo(() => {
    if (!projectSheetOptions.length) return '';
    const p =
      filterProject && filterProject !== LADDER_PROJECT_NONE
        ? filterProject
        : getDefaultProjectForDivision(division);
    if (projectSheetOptions.some((o) => o.value === p)) return p;
    return projectSheetOptions[0]!.value;
  }, [division, filterProject, projectSheetOptions]);

  /** Align Firestore shard with the sub-ranking `<select>` (resolved default when state is still `__none__`). */
  const shardProjectParam = projectSheetOptions.length > 0 ? projectControlValue : filterProject;

  const shardId = useMemo(() => getLeaderboardShardId(division, shardProjectParam), [division, shardProjectParam]);

  const activeDetailedFilterCount = useMemo(() => {
    let n = 0;
    if (genderFilter !== 'all') n++;
    if (ageBucketFilter !== 'all') n++;
    if (heightBucketFilter !== 'all') n++;
    if (weightBucketFilter !== 'all') n++;
    if (jobCategoryFilter !== 'all') n++;
    if (countryCodeFilter !== 'all') n++;
    if (cityFilter !== 'all') n++;
    if (districtFilter !== 'all') n++;
    return n;
  }, [
    genderFilter,
    ageBucketFilter,
    heightBucketFilter,
    weightBucketFilter,
    jobCategoryFilter,
    countryCodeFilter,
    cityFilter,
    districtFilter,
  ]);

  /** Must be declared before `useLadderLeaderboard` — passing it earlier hits TDZ (`const` not initialized). */
  const initialFilters = useMemo(
    () => ({
      gender: genderFilter,
      ageBucket: ageBucketFilter,
      heightBucket: heightBucketFilter,
      weightBucket: weightBucketFilter,
      jobCategory: jobCategoryFilter,
      countryCode: countryCodeFilter,
      city: cityFilter,
      district: districtFilter,
    }),
    [
      genderFilter,
      ageBucketFilter,
      heightBucketFilter,
      weightBucketFilter,
      jobCategoryFilter,
      countryCodeFilter,
      cityFilter,
      districtFilter,
    ]
  );

  const { items, datasetItems, loading, error, myEntry, myRank } = useLadderLeaderboard(shardId, initialFilters, {
    refreshNonce: ladderRefreshNonce,
    page: currentPage,
    pageSize,
  });

  useEffect(() => {
    previousRankRef.current = null;
  }, [shardId]);

  useEffect(() => {
    if (!pendingScrollUidRef.current || loading) return;
    const target = rowRefs.current.get(pendingScrollUidRef.current);
    if (!target) {
      pendingScrollUidRef.current = null;
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    pendingScrollUidRef.current = null;
  }, [items, loading]);
  const countryCodesInDataset = useMemo(() => {
    const next = new Set<LadderCountryCode>();
    for (const row of datasetItems) {
      if (isLadderCountryCode(row.countryCode)) next.add(row.countryCode);
    }
    return [...next].sort((a, b) => a.localeCompare(b));
  }, [datasetItems]);

  const locationRows = useMemo(() => {
    if (countryCodeFilter === 'all') return [];
    return datasetItems.filter((row) => row.countryCode === countryCodeFilter);
  }, [datasetItems, countryCodeFilter]);

  const cityOptions = useMemo(() => {
    if (countryCodeFilter === 'all') return [];
    return Array.from(
      new Set(locationRows.map((row) => row.city).filter((x): x is string => Boolean(x)))
    ).sort((a, b) => a.localeCompare(b));
  }, [locationRows, countryCodeFilter]);

  const effectiveCityFilter = useMemo(
    () => resolveEffectiveLadderCityFilter(cityFilter, cityOptions),
    [cityFilter, cityOptions]
  );

  const districtOptions = useMemo(() => {
    if (countryCodeFilter === 'all') return [];
    const base =
      effectiveCityFilter === 'all'
        ? locationRows
        : locationRows.filter((row) => row.city === effectiveCityFilter);
    return Array.from(
      new Set(base.map((row) => row.district).filter((x): x is string => Boolean(x)))
    ).sort((a, b) => a.localeCompare(b));
  }, [locationRows, effectiveCityFilter, countryCodeFilter]);

  const effectiveDistrictFilter = useMemo(
    () => resolveEffectiveLadderDistrictFilter(districtFilter, districtOptions),
    [districtFilter, districtOptions]
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
    locationLabelsTw: countryCodeFilter === 'TW',
  });

  useEffect(() => {
    if (!canEnter) {
      navigate(ROUTES.joinArena, { replace: true });
    }
  }, [canEnter, navigate]);

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

  useEffect(() => {
    const updateNearTop = () => {
      setIsNearTop(window.scrollY <= 24);
    };
    updateNearTop();
    window.addEventListener('scroll', updateNearTop, { passive: true });
    return () => window.removeEventListener('scroll', updateNearTop);
  }, []);

  const formatFloatingScore = useCallback(
    (metric: LeaderboardShardId, scoreBest: number) => formatLeaderboardRowScore(metric, scoreBest, t),
    [t]
  );

  const jumpToMyRow = useCallback(() => {
    if (!authUid || myRank === null || myRank <= 0) return;
    const targetPage = Math.max(1, Math.ceil(myRank / pageSize));
    pendingScrollUidRef.current = authUid;
    setCurrentPage(targetPage);
  }, [authUid, myRank, pageSize]);

  const closePreviewModal = useCallback(() => {
    previewRequestIdRef.current += 1;
    setPreviewOpen(false);
    setSelectedUid(null);
    setPreviewLoading(false);
    setPreviewError(false);
    setPreviewUser(null);
  }, []);

  const handleOpenUserPreview = useCallback(
    async (uid: string, anonymous: boolean) => {
      if (!uid || anonymous) return;
      const requestId = previewRequestIdRef.current + 1;
      previewRequestIdRef.current = requestId;
      setSelectedUid(uid);
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreviewError(false);
      setPreviewUser(null);

      const result = await getLadderUserPreview({ entitlement, uid });
      if (previewRequestIdRef.current !== requestId) return;
      if (!result.ok || !result.item) {
        setPreviewLoading(false);
        setPreviewError(true);
        return;
      }
      setPreviewUser(result.item);
      setPreviewLoading(false);
    },
    [entitlement]
  );

  const userInVisibleItems = useMemo(() => {
    if (!authUid) return false;
    return items.some((row) => row.uid === authUid);
  }, [authUid, items]);

  const showFloatingRankBar =
    myRank !== null &&
    myRank > 0 &&
    myEntry !== null &&
    Number.isFinite(myEntry.scoreBest) &&
    myEntry.scoreBest > 0 &&
    !userInVisibleItems;

  const canPrevPage = currentPage > 1;
  const canNextPage = datasetItems.length === pageSize;

  if (!canEnter) {
    return (
      <main className="ui-shell max-w-xl">
        <p className="text-sm text-zinc-500">{t('ladder.redirecting', { ns: 'common' })}</p>
      </main>
    );
  }

  return (
    <main className="ui-shell flex max-w-3xl flex-col gap-3 pb-28">
      <div className="sticky top-0 z-20 -mx-1 sm:-mx-0">
        <div
          className={`ui-card relative overflow-hidden border-accent-info/25 bg-bg-card/90 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-bg-card/95 to-bg-card/100 py-3 backdrop-blur-md transition-all duration-300 ${
            isNearTop
              ? 'shadow-[0_18px_45px_-30px_rgba(239,68,68,0.75)]'
              : 'shadow-[0_10px_28px_-24px_rgba(239,68,68,0.35)]'
          }`}
        >
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent transition-all duration-300 ${
              isNearTop ? 'via-red-500/70' : 'via-red-500/35'
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-red-500/12 to-transparent transition-opacity duration-300 ${
              isNearTop ? 'opacity-100' : 'opacity-40'
            }`}
          />
          <h1 className="text-base font-semibold tracking-tight text-zinc-100 md:text-lg">
            {t('ladder.title', { ns: 'common' })}
          </h1>
          <LeaderboardSyncAllBar onFinished={bumpLadderRefresh} className="mt-1" />

          <nav
            className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label={t('ladder.divisionPickerTitle', { ns: 'common' })}
          >
            {LADDER_DIVISION_IDS.map((d) => (
              <button
                key={d}
                type="button"
                title={t(`ladder.divisions.${d}.desc`, { ns: 'common' })}
                aria-current={division === d ? 'true' : undefined}
                onClick={() => selectDivision(d)}
                className={`shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-all ${
                  division === d
                    ? 'border-b-2 border-red-500 bg-gradient-to-t from-red-500/15 to-transparent text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                    : 'border-b-2 border-zinc-800 bg-transparent text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {t(`ladder.divisions.${d}.label`, { ns: 'common' })}
              </button>
            ))}
          </nav>

        {projectSheetOptions.length > 1 ? (
          <label className="mt-2 flex flex-col gap-1 text-xs text-zinc-400">
            <OptionSelectSheet
              value={projectControlValue}
              onChange={(next) => {
                setFilterProject(next === '' ? getDefaultProjectForDivision(division) : next);
                setCurrentPage(1);
              }}
              placeholder={t('ladder.filters.all', { ns: 'common' })}
              title={t('ladder.projectFilterLabel', { ns: 'common' })}
              options={projectSheetOptions}
              allowEmpty={false}
            />
          </label>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="ui-btn py-1.5 text-xs"
            aria-expanded={filtersExpanded}
            aria-controls={expandedFiltersPanelId}
            onClick={() => setFiltersExpanded((v) => !v)}
          >
            {filtersExpanded ? t('ladder.hideFilters', { ns: 'common' }) : t('ladder.moreFilters', { ns: 'common' })}
            {activeDetailedFilterCount > 0 ? (
              <span className="ml-1.5 font-mono text-[10px] text-zinc-500">
                {t('ladder.activeFilterCount', { ns: 'common', count: activeDetailedFilterCount })}
              </span>
            ) : null}
          </button>
        </div>

        {filtersExpanded ? (
          <div
            id={expandedFiltersPanelId}
            className="relative mt-4 max-h-[min(70vh,28rem)] space-y-4 overflow-y-auto rounded-xl border border-zinc-800/90 bg-bg-panel/70 p-4 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.06)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-info/25 to-transparent" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {t('ladder.filters.title', { ns: 'common' })}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('ladder.filters.gender', { ns: 'common' })}</span>
                <OptionSelectSheet
                  value={genderFilter === 'all' ? '' : genderFilter}
                  onChange={(next) => {
                    setGenderFilter(next === '' ? 'all' : next);
                    setCurrentPage(1);
                  }}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.gender', { ns: 'common' })}
                  options={genderOptions}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('ladder.filters.ageBucket', { ns: 'common' })}</span>
                <OptionSelectSheet
                  value={ageBucketFilter === 'all' ? '' : ageBucketFilter}
                  onChange={(next) => {
                    setAgeBucketFilter(next === '' ? 'all' : next);
                    setCurrentPage(1);
                  }}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.ageBucket', { ns: 'common' })}
                  options={ageBucketOptions}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('ladder.filters.heightBucket', { ns: 'common' })}</span>
                <OptionSelectSheet
                  value={heightBucketFilter === 'all' ? '' : heightBucketFilter}
                  onChange={(next) => {
                    setHeightBucketFilter(next === '' ? 'all' : next);
                    setCurrentPage(1);
                  }}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.heightBucket', { ns: 'common' })}
                  options={heightBucketOptions}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('ladder.filters.weightBucket', { ns: 'common' })}</span>
                <OptionSelectSheet
                  value={weightBucketFilter === 'all' ? '' : weightBucketFilter}
                  onChange={(next) => {
                    setWeightBucketFilter(next === '' ? 'all' : next);
                    setCurrentPage(1);
                  }}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.weightBucket', { ns: 'common' })}
                  options={weightBucketOptions}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('ladder.filters.jobCategory', { ns: 'common' })}</span>
                <OptionSelectSheet
                  value={jobCategoryFilter === 'all' ? '' : jobCategoryFilter}
                  onChange={(next) => {
                    setJobCategoryFilter(next === '' ? 'all' : next);
                    setCurrentPage(1);
                  }}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.jobCategory', { ns: 'common' })}
                  options={jobCategoryOptions}
                />
              </label>
              {countryCodesInDataset.length > 0 ? (
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">{t('ladder.filters.country', { ns: 'common' })}</span>
                  <OptionSelectSheet
                    value={countryCodeFilter === 'all' ? '' : countryCodeFilter}
                    onChange={(next) => {
                      if (next === '') {
                        setCountryCodeFilter('all');
                      } else {
                        setCountryCodeFilter(isLadderCountryCode(next) ? next : 'all');
                      }
                      setCityFilter('all');
                      setDistrictFilter('all');
                      setCurrentPage(1);
                    }}
                    placeholder={t('ladder.filters.all', { ns: 'common' })}
                    title={t('ladder.filters.filterSheetTitles.country', { ns: 'common' })}
                    options={countrySelectOptions}
                  />
                </label>
              ) : null}
              {countryCodeFilter !== 'all' && cityOptions.length > 0 ? (
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">{t('ladder.filters.city', { ns: 'common' })}</span>
                  <OptionSelectSheet
                    value={effectiveCityFilter === 'all' ? '' : effectiveCityFilter}
                    onChange={(next) => {
                      setCityFilter(next === '' ? 'all' : next);
                      setDistrictFilter('all');
                      setCurrentPage(1);
                    }}
                    placeholder={t('ladder.filters.all', { ns: 'common' })}
                    title={t('ladder.filters.filterSheetTitles.city', { ns: 'common' })}
                    options={twCitySelectOptions}
                  />
                </label>
              ) : null}
              {countryCodeFilter !== 'all' && districtOptions.length > 0 ? (
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">{t('ladder.filters.district', { ns: 'common' })}</span>
                  <OptionSelectSheet
                    value={effectiveDistrictFilter === 'all' ? '' : effectiveDistrictFilter}
                    onChange={(next) => {
                      setDistrictFilter(next === '' ? 'all' : next);
                      setCurrentPage(1);
                    }}
                    placeholder={t('ladder.filters.all', { ns: 'common' })}
                    title={t('ladder.filters.filterSheetTitles.district', { ns: 'common' })}
                    options={twDistrictSelectOptions}
                  />
                </label>
              ) : null}
            </div>
          </div>
        ) : null}
        </div>
      </div>

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

      <section className="ui-card relative min-h-[50vh] flex-1 overflow-hidden border-accent-info/25 shadow-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <header className="space-y-1 pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-info">
            {t('ladder.rankings.kicker', { ns: 'common' })}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            {t('ladder.rankings.title', { ns: 'common' })}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">{t('ladder.rankings.subtitle', { ns: 'common' })}</p>
        </header>

        {loading ? (
          <div className="space-y-3 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg border border-zinc-800/80 bg-zinc-900/50" />
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
              const displayName = isAnonymousRow ? t('ladder.anonymousName', { ns: 'common' }) : row.displayName || row.uid;
              const secondaryLine = isAnonymousRow ? t('ladder.anonymousIdLabel', { ns: 'common' }) : row.uid;
              const rowTierClass = isRank1
                ? 'bg-gradient-to-r from-amber-500/10 to-bg-panel/40 border-l-4 border-l-amber-500 border-y border-r border-y-amber-500/20 border-r-amber-500/20'
                : isRank2
                  ? 'bg-gradient-to-r from-slate-300/10 to-bg-panel/40 border-l-4 border-l-slate-300 border-y border-r border-y-slate-300/20 border-r-slate-300/20'
                  : isRank3
                    ? 'bg-gradient-to-r from-orange-500/10 to-bg-panel/40 border-l-4 border-l-orange-500 border-y border-r border-y-orange-500/20 border-r-orange-500/20'
                    : 'bg-zinc-900/40 border-l-2 border-l-zinc-700 border-y border-r border-zinc-800/80 hover:bg-zinc-800/60';
              const meHighlightClass = isMe ? 'ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.15)] z-10' : '';
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
                      void handleOpenUserPreview(row.uid, isAnonymousRow);
                    }}
                    className={`group relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-md px-3 py-3 text-left text-sm transition-all duration-200 sm:gap-4 sm:px-4 ${rowTierClass} ${meHighlightClass} disabled:cursor-not-allowed disabled:opacity-90`}
                  >
                  <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <span className={`shrink-0 w-7 text-center font-mono sm:w-10 sm:text-left ${rankClass}`}>
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
                      <p className={`truncate font-medium text-zinc-100 ${isAnonymousRow ? 'italic opacity-70' : ''}`}>
                        {displayName}
                      </p>
                      <p
                        className={`hidden truncate text-[10px] uppercase sm:block ${
                          isAnonymousRow ? 'font-mono tracking-widest text-zinc-600' : 'tracking-widest text-zinc-500'
                        }`}
                      >
                        {secondaryLine}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 min-w-[56px] text-right sm:min-w-[84px]">
                    <p className={`font-mono text-xs font-semibold tabular-nums transition-colors duration-200 sm:text-base ${scoreClass}`}>
                      {formatLeaderboardRowScore(shardId, row.scoreBest, t)}
                    </p>
                    <p className="hidden text-[10px] text-zinc-500 sm:block" title={new Date(row.updatedAt).toLocaleString()}>
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
      {showFloatingRankBar ? (
        <LadderFloatingRankBar
          shardId={shardId}
          myRank={myRank}
          myScore={myEntry.scoreBest}
          onJumpToMyRow={jumpToMyRow}
          formatScore={formatFloatingScore}
        />
      ) : null}
      <LadderUserPreviewModal
        open={previewOpen}
        loading={previewLoading}
        error={previewError || !selectedUid}
        user={previewUser}
        onClose={closePreviewModal}
      />
    </main>
  );
}
