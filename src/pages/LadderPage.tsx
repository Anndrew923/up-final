import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../config/routes';
import { useLadderLeaderboard } from '../hooks/useLadderLeaderboard';
import { useLeaderboardAccess } from '../hooks/useLeaderboardAccess';
import type { SubmitLeaderboardInput } from '../services/leaderboardService';
import { isFirestoreConfigured } from '../services/firebaseClient';
import {
  LADDER_AGE_BUCKETS,
  LADDER_HEIGHT_BUCKETS,
  LADDER_JOB_CATEGORIES,
  LADDER_WEIGHT_BUCKETS,
} from '../types/ladderProfile';

const METRICS: SubmitLeaderboardInput['metric'][] = [
  'strength',
  'explosivePower',
  'cardio',
  'muscleMass',
  'bodyFat',
  'gripStrength',
  'armSize',
];

/**
 * Leaderboard arena — loads rankings via `leaderboardService` (Firestore when configured).
 * Non-eligible users redirect before any leaderboard I/O.
 */
export default function LadderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEnter } = useLeaderboardAccess();
  const [metric, setMetric] = useState<SubmitLeaderboardInput['metric']>('strength');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [ageBucketFilter, setAgeBucketFilter] = useState<(typeof LADDER_AGE_BUCKETS)[number] | 'all'>(
    'all'
  );
  const [heightBucketFilter, setHeightBucketFilter] = useState<
    (typeof LADDER_HEIGHT_BUCKETS)[number] | 'all'
  >('all');
  const [weightBucketFilter, setWeightBucketFilter] = useState<
    (typeof LADDER_WEIGHT_BUCKETS)[number] | 'all'
  >('all');
  const [jobCategoryFilter, setJobCategoryFilter] = useState<
    (typeof LADDER_JOB_CATEGORIES)[number] | 'all'
  >('all');
  const [regionScopeFilter, setRegionScopeFilter] = useState<'all' | 'country' | 'city' | 'district'>(
    'all'
  );
  const [cityFilter, setCityFilter] = useState<string | 'all'>('all');
  const [districtFilter, setDistrictFilter] = useState<string | 'all'>('all');
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
    [genderFilter, ageBucketFilter, heightBucketFilter, weightBucketFilter, jobCategoryFilter, regionScopeFilter, cityFilter, districtFilter]
  );
  const { items, loading, error, fromCache } = useLadderLeaderboard(metric, initialFilters);
  const twItems = useMemo(() => items.filter((row) => row.countryCode === 'TW'), [items]);
  const twCityOptions = useMemo(
    () =>
      Array.from(new Set(twItems.map((row) => row.city).filter((x): x is string => Boolean(x)))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [twItems]
  );
  const twDistrictOptions = useMemo(() => {
    const base = cityFilter === 'all' ? twItems : twItems.filter((row) => row.city === cityFilter);
    return Array.from(
      new Set(base.map((row) => row.district).filter((x): x is string => Boolean(x)))
    ).sort((a, b) => a.localeCompare(b));
  }, [twItems, cityFilter]);

  const effectiveCityFilter =
    cityFilter !== 'all' && !twCityOptions.includes(cityFilter) ? 'all' : cityFilter;
  const effectiveDistrictFilter =
    districtFilter !== 'all' && !twDistrictOptions.includes(districtFilter) ? 'all' : districtFilter;

  const usesRemote = isFirestoreConfigured();

  useEffect(() => {
    if (!canEnter) {
      navigate(ROUTES.joinArena, { replace: true });
    }
  }, [canEnter, navigate]);

  if (!canEnter) {
    return (
      <main className="ui-shell max-w-xl">
        <p className="text-sm text-zinc-500">{t('ladder.redirecting', { ns: 'common' })}</p>
      </main>
    );
  }

  return (
    <main className="ui-shell max-w-3xl space-y-8">
      <section className="relative overflow-hidden rounded-xl border border-accent-primary/35 bg-bg-card shadow-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/45 to-transparent" />
        <div className="px-5 py-7 md:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-primary">
            {t('ladder.kicker', { ns: 'common' })}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
            {t('ladder.title', { ns: 'common' })}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {usesRemote
              ? t('ladder.bodyRemote', { ns: 'common' })
              : t('ladder.bodyLocalMock', { ns: 'common' })}
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            {fromCache
              ? t('ladder.cacheHit', { ns: 'common' })
              : t('ladder.cacheMiss', { ns: 'common' })}
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              metric === m
                ? 'border-accent-primary bg-accent-primary/15 text-accent-primary'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            {t(`ladder.metrics.${m}`, { ns: 'common' })}
          </button>
        ))}
      </div>

      <section className="ui-card space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100">{t('ladder.filters.title', { ns: 'common' })}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span>{t('ladder.filters.gender', { ns: 'common' })}</span>
            <select className="ui-input" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as 'all' | 'male' | 'female')}>
              <option value="all">{t('ladder.filters.all', { ns: 'common' })}</option>
              <option value="male">{t('home.profile.male', { ns: 'common' })}</option>
              <option value="female">{t('home.profile.female', { ns: 'common' })}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span>{t('ladder.filters.ageBucket', { ns: 'common' })}</span>
            <select className="ui-input" value={ageBucketFilter} onChange={(e) => setAgeBucketFilter(e.target.value as (typeof LADDER_AGE_BUCKETS)[number] | 'all')}>
              <option value="all">{t('ladder.filters.all', { ns: 'common' })}</option>
              {LADDER_AGE_BUCKETS.map((bucket) => (
                <option key={bucket} value={bucket}>{bucket}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span>{t('ladder.filters.heightBucket', { ns: 'common' })}</span>
            <select className="ui-input" value={heightBucketFilter} onChange={(e) => setHeightBucketFilter(e.target.value as (typeof LADDER_HEIGHT_BUCKETS)[number] | 'all')}>
              <option value="all">{t('ladder.filters.all', { ns: 'common' })}</option>
              {LADDER_HEIGHT_BUCKETS.map((bucket) => (
                <option key={bucket} value={bucket}>{bucket}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span>{t('ladder.filters.weightBucket', { ns: 'common' })}</span>
            <select className="ui-input" value={weightBucketFilter} onChange={(e) => setWeightBucketFilter(e.target.value as (typeof LADDER_WEIGHT_BUCKETS)[number] | 'all')}>
              <option value="all">{t('ladder.filters.all', { ns: 'common' })}</option>
              {LADDER_WEIGHT_BUCKETS.map((bucket) => (
                <option key={bucket} value={bucket}>{bucket}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span>{t('ladder.filters.jobCategory', { ns: 'common' })}</span>
            <select className="ui-input" value={jobCategoryFilter} onChange={(e) => setJobCategoryFilter(e.target.value as (typeof LADDER_JOB_CATEGORIES)[number] | 'all')}>
              <option value="all">{t('ladder.filters.all', { ns: 'common' })}</option>
              {LADDER_JOB_CATEGORIES.map((job) => (
                <option key={job} value={job}>{t(`home.profile.jobOptions.${job}`, { ns: 'common' })}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span>{t('ladder.filters.regionScope', { ns: 'common' })}</span>
            <select className="ui-input" value={regionScopeFilter} onChange={(e) => setRegionScopeFilter(e.target.value as 'all' | 'country' | 'city' | 'district')}>
              <option value="all">{t('ladder.filters.all', { ns: 'common' })}</option>
              <option value="country">{t('ladder.filters.regionScopeOptions.country', { ns: 'common' })}</option>
              <option value="city">{t('ladder.filters.regionScopeOptions.city', { ns: 'common' })}</option>
              <option value="district">{t('ladder.filters.regionScopeOptions.district', { ns: 'common' })}</option>
            </select>
          </label>
          {twCityOptions.length > 0 ? (
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              <span>{t('ladder.filters.city', { ns: 'common' })}</span>
              <select
                className="ui-input"
                value={effectiveCityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setDistrictFilter('all');
                }}
              >
                <option value="all">{t('ladder.filters.all', { ns: 'common' })}</option>
                {twCityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {twDistrictOptions.length > 0 ? (
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              <span>{t('ladder.filters.district', { ns: 'common' })}</span>
              <select
                className="ui-input"
                value={effectiveDistrictFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
              >
                <option value="all">{t('ladder.filters.all', { ns: 'common' })}</option>
                {twDistrictOptions.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-bg-panel/90">
        {loading ? (
          <div className="space-y-3 px-5 py-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/80" />
            ))}
          </div>
        ) : error ? (
          <p className="px-5 py-8 text-sm text-rose-400">
            {t('ladder.loadError', { ns: 'common' })}
          </p>
        ) : items.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-500">{t('ladder.empty', { ns: 'common' })}</p>
        ) : (
          <ul className="divide-y divide-zinc-800/90">
            {items.map((row, index) => (
              <li
                key={row.uid}
                className="flex items-center justify-between gap-4 px-5 py-4 text-sm text-zinc-200"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-accent-info">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-zinc-100">{row.displayName || row.uid}</p>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">{row.uid}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-accent-primary">{row.scoreBest}</p>
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
