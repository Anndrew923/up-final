import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OptionSelectSheet from '../components/home/OptionSelectSheet';
import { ROUTES } from '../config/routes';
import { useDopamineFeedback } from '../hooks/useDopamineFeedback';
import { useLadderFilterSheetOptions } from '../hooks/useLadderFilterSheetOptions';
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
} from '../logic/core/ladderShards';
import { detectPromotion } from '../logic/core/leaderboardProgress';
import { isFirestoreConfigured } from '../services/firebaseClient';
import { useLeaderboardCeremonyStore } from '../stores/leaderboardCeremonyStore';
import type {
  LadderAgeBucket,
  LadderHeightBucket,
  LadderJobCategory,
  LadderRegionScope,
  LadderWeightBucket,
} from '../types/ladderProfile';

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
  const [regionScopeFilter, setRegionScopeFilter] = useState<'all' | LadderRegionScope>('all');
  const [cityFilter, setCityFilter] = useState<string | 'all'>('all');
  const [districtFilter, setDistrictFilter] = useState<string | 'all'>('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const previousRankRef = useRef<number | null>(null);
  const expandedFiltersPanelId = useId();

  const selectDivision = useCallback((next: LadderDivisionId) => {
    setDivision(next);
    setFilterProject(getDefaultProjectForDivision(next));
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
    if (regionScopeFilter !== 'all') n++;
    if (cityFilter !== 'all') n++;
    if (districtFilter !== 'all') n++;
    return n;
  }, [
    genderFilter,
    ageBucketFilter,
    heightBucketFilter,
    weightBucketFilter,
    jobCategoryFilter,
    regionScopeFilter,
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
      regionScope: regionScopeFilter,
      city: cityFilter,
      district: districtFilter,
    }),
    [
      genderFilter,
      ageBucketFilter,
      heightBucketFilter,
      weightBucketFilter,
      jobCategoryFilter,
      regionScopeFilter,
      cityFilter,
      districtFilter,
    ]
  );
  const { items, loading, error, fromCache, myRank } = useLadderLeaderboard(shardId, initialFilters);

  useEffect(() => {
    previousRankRef.current = null;
  }, [shardId]);
  const twItems = useMemo(() => items.filter((row) => row.countryCode === 'TW'), [items]);
  const twCityOptions = useMemo(
    () =>
      Array.from(new Set(twItems.map((row) => row.city).filter((x): x is string => Boolean(x)))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [twItems]
  );
  const effectiveCityFilter = useMemo(
    () => resolveEffectiveLadderCityFilter(cityFilter, twCityOptions),
    [cityFilter, twCityOptions]
  );
  const twDistrictOptions = useMemo(() => {
    const base =
      effectiveCityFilter === 'all'
        ? twItems
        : twItems.filter((row) => row.city === effectiveCityFilter);
    return Array.from(
      new Set(base.map((row) => row.district).filter((x): x is string => Boolean(x)))
    ).sort((a, b) => a.localeCompare(b));
  }, [twItems, effectiveCityFilter]);
  const effectiveDistrictFilter = useMemo(
    () => resolveEffectiveLadderDistrictFilter(districtFilter, twDistrictOptions),
    [districtFilter, twDistrictOptions]
  );

  const {
    genderOptions,
    ageBucketOptions,
    heightBucketOptions,
    weightBucketOptions,
    jobCategoryOptions,
    regionScopeOptions,
    twCitySelectOptions,
    twDistrictSelectOptions,
  } = useLadderFilterSheetOptions(twCityOptions, twDistrictOptions);

  const usesRemote = isFirestoreConfigured();

  const statusLine = useMemo(
    () =>
      `${usesRemote ? t('ladder.bodyRemote', { ns: 'common' }) : t('ladder.bodyLocalMock', { ns: 'common' })} · ${
        fromCache ? t('ladder.cacheHit', { ns: 'common' }) : t('ladder.cacheMiss', { ns: 'common' })
      }`,
    [t, usesRemote, fromCache]
  );

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

  if (!canEnter) {
    return (
      <main className="ui-shell max-w-xl">
        <p className="text-sm text-zinc-500">{t('ladder.redirecting', { ns: 'common' })}</p>
      </main>
    );
  }

  return (
    <main className="ui-shell flex max-w-3xl flex-col gap-3 pb-12">
      <div className="sticky top-0 z-20 -mx-1 sm:-mx-0">
        <div className="ui-card relative overflow-hidden border-accent-info/25 bg-bg-card/95 shadow-panel backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-info/40 to-transparent" />
          <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-info">
                {t('ladder.kicker', { ns: 'common' })}
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-100 md:text-xl">
                {t('ladder.title', { ns: 'common' })}
              </h1>
            </div>
            <p className="max-w-[min(100%,20rem)] text-right text-[10px] leading-snug text-zinc-500">{statusLine}</p>
          </div>

        <nav
          className="mt-4 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t('ladder.divisionPickerTitle', { ns: 'common' })}
        >
          {LADDER_DIVISION_IDS.map((d) => (
            <button
              key={d}
              type="button"
              title={t(`ladder.divisions.${d}.desc`, { ns: 'common' })}
              aria-current={division === d ? 'true' : undefined}
              onClick={() => selectDivision(d)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                division === d
                  ? 'border-accent-primary bg-accent-primary/15 text-accent-primary'
                  : 'border-zinc-700 bg-bg-panel/70 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {t(`ladder.divisions.${d}.label`, { ns: 'common' })}
            </button>
          ))}
        </nav>

        {projectSheetOptions.length > 0 ? (
          <label className="mt-4 flex flex-col gap-1 text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">{t('ladder.projectFilterLabel', { ns: 'common' })}</span>
            <OptionSelectSheet
              value={projectControlValue}
              onChange={(next) => setFilterProject(next === '' ? getDefaultProjectForDivision(division) : next)}
              placeholder={t('ladder.filters.all', { ns: 'common' })}
              title={t('ladder.projectFilterLabel', { ns: 'common' })}
              options={projectSheetOptions}
              allowEmpty={false}
            />
          </label>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
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
          {import.meta.env.DEV ? (
            <span className="font-mono text-[9px] text-zinc-600">{t('ladder.shardLabel', { ns: 'common', shardId })}</span>
          ) : null}
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
                  onChange={(next) => setGenderFilter(next === '' ? 'all' : next)}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.gender', { ns: 'common' })}
                  options={genderOptions}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('ladder.filters.ageBucket', { ns: 'common' })}</span>
                <OptionSelectSheet
                  value={ageBucketFilter === 'all' ? '' : ageBucketFilter}
                  onChange={(next) => setAgeBucketFilter(next === '' ? 'all' : next)}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.ageBucket', { ns: 'common' })}
                  options={ageBucketOptions}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('ladder.filters.heightBucket', { ns: 'common' })}</span>
                <OptionSelectSheet
                  value={heightBucketFilter === 'all' ? '' : heightBucketFilter}
                  onChange={(next) => setHeightBucketFilter(next === '' ? 'all' : next)}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.heightBucket', { ns: 'common' })}
                  options={heightBucketOptions}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('ladder.filters.weightBucket', { ns: 'common' })}</span>
                <OptionSelectSheet
                  value={weightBucketFilter === 'all' ? '' : weightBucketFilter}
                  onChange={(next) => setWeightBucketFilter(next === '' ? 'all' : next)}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.weightBucket', { ns: 'common' })}
                  options={weightBucketOptions}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('ladder.filters.jobCategory', { ns: 'common' })}</span>
                <OptionSelectSheet
                  value={jobCategoryFilter === 'all' ? '' : jobCategoryFilter}
                  onChange={(next) => setJobCategoryFilter(next === '' ? 'all' : next)}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.jobCategory', { ns: 'common' })}
                  options={jobCategoryOptions}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('ladder.filters.regionScope', { ns: 'common' })}</span>
                <OptionSelectSheet
                  value={regionScopeFilter === 'all' ? '' : regionScopeFilter}
                  onChange={(next) => setRegionScopeFilter(next === '' ? 'all' : next)}
                  placeholder={t('ladder.filters.all', { ns: 'common' })}
                  title={t('ladder.filters.filterSheetTitles.regionScope', { ns: 'common' })}
                  options={regionScopeOptions}
                />
              </label>
              {twCityOptions.length > 0 ? (
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">{t('ladder.filters.city', { ns: 'common' })}</span>
                  <OptionSelectSheet
                    value={effectiveCityFilter === 'all' ? '' : effectiveCityFilter}
                    onChange={(next) => {
                      setCityFilter(next === '' ? 'all' : next);
                      setDistrictFilter('all');
                    }}
                    placeholder={t('ladder.filters.all', { ns: 'common' })}
                    title={t('ladder.filters.filterSheetTitles.city', { ns: 'common' })}
                    options={twCitySelectOptions}
                  />
                </label>
              ) : null}
              {twDistrictOptions.length > 0 ? (
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">{t('ladder.filters.district', { ns: 'common' })}</span>
                  <OptionSelectSheet
                    value={effectiveDistrictFilter === 'all' ? '' : effectiveDistrictFilter}
                    onChange={(next) => setDistrictFilter(next === '' ? 'all' : next)}
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-info/40 to-transparent" />
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
            {items.map((row, index) => (
              <li
                key={row.uid}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800/90 bg-zinc-900/35 px-4 py-3 text-sm text-zinc-200 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.05)]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="shrink-0 font-mono text-xs text-accent-info">#{row.rank ?? index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-100">{row.displayName || row.uid}</p>
                    <p className="truncate text-[10px] uppercase tracking-widest text-zinc-500">{row.uid}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-lg font-semibold tabular-nums text-accent-primary">{row.scoreBest}</p>
                  <p className="text-[10px] text-zinc-500">
                    {t('ladder.updatedLabel', { ns: 'common' })}{' '}
                    {new Date(row.updatedAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
