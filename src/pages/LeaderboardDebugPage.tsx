import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  canAccessLeaderboard,
  canUploadLeaderboard,
  getEntitlementReasonCode,
  hasCoreAccess,
  shouldBlockFirebase,
} from '../logic/core/entitlement';
import { KNOWN_LEADERBOARD_SHARD_IDS, type LeaderboardShardId } from '../logic/core/ladderShards';
import { listLeaderboard, submitLeaderboardScore } from '../services/leaderboardService';
import { clearLeaderboardCache, getCachedLeaderboard } from '../services/leaderboardCacheService';
import { buildLeaderboardProfileProjection } from '../logic/core/leaderboardProfileProjection';
import { loadPhysicalProfile } from '../services/localStorageService';
import { useEntitlementStore } from '../stores/entitlementStore';

type DebugMetric = LeaderboardShardId;

const METRICS: DebugMetric[] = [...KNOWN_LEADERBOARD_SHARD_IDS];

interface LeaderboardDebugPageProps {
  onBack: () => void;
}

interface DebugLogItem {
  id: string;
  label: string;
  payload: unknown;
}

export default function LeaderboardDebugPage({ onBack }: LeaderboardDebugPageProps) {
  const { t } = useTranslation();

  const purchaseStatus = useEntitlementStore((state) => state.purchaseStatus);
  const subscriptionStatus = useEntitlementStore((state) => state.subscriptionStatus);
  const isPro = useEntitlementStore((state) => state.isPro);
  const proExpiresAt = useEntitlementStore((state) => state.proExpiresAt);
  const planId = useEntitlementStore((state) => state.planId);
  const lastCheckedAt = useEntitlementStore((state) => state.lastCheckedAt);
  const setPurchaseStatus = useEntitlementStore((state) => state.setPurchaseStatus);
  const setSubscriptionStatus = useEntitlementStore((state) => state.setSubscriptionStatus);
  const setProExpiry = useEntitlementStore((state) => state.setProExpiry);

  const [metric, setMetric] = useState<DebugMetric>('armSize');
  const [page, setPage] = useState(1);
  const [uid, setUid] = useState('demo-user');
  const [displayName, setDisplayName] = useState('Demo User');
  const [score, setScore] = useState(88);
  const [lastListResult, setLastListResult] = useState<unknown>(null);
  const [lastSubmitResult, setLastSubmitResult] = useState<unknown>(null);
  const [logs, setLogs] = useState<DebugLogItem[]>([]);

  const entitlement = useMemo(
    () => ({
      purchaseStatus,
      subscriptionStatus,
      isPro,
      proExpiresAt,
      planId,
      lastCheckedAt,
    }),
    [purchaseStatus, subscriptionStatus, isPro, proExpiresAt, planId, lastCheckedAt]
  );

  const reasonRead = getEntitlementReasonCode(entitlement, 'leaderboard-read');
  const reasonWrite = getEntitlementReasonCode(entitlement, 'leaderboard-write');
  const readBlocked = shouldBlockFirebase(entitlement, 'leaderboard-read');
  const writeBlocked = shouldBlockFirebase(entitlement, 'leaderboard-write');
  const cacheProbe = getCachedLeaderboard({ metric, page });

  const addLog = (label: string, payload: unknown) => {
    const now = new Date().toISOString();
    setLogs((current) =>
      [{ id: `${now}-${label}`, label: `${now} ${label}`, payload }, ...current].slice(0, 12)
    );
  };

  const handleListLeaderboard = async () => {
    const result = await listLeaderboard({
      entitlement,
      metric,
      page,
    });
    setLastListResult(result);
    addLog(t('debugListAction', { ns: 'common' }), result);
  };

  const handleSubmitScore = async () => {
    const profileProjection = buildLeaderboardProfileProjection(loadPhysicalProfile());
    const result = await submitLeaderboardScore({
      entitlement,
      input: {
        uid,
        metric,
        score,
        displayName,
        profile: profileProjection ?? undefined,
      },
    });
    setLastSubmitResult(result);
    addLog(t('debugSubmitAction', { ns: 'common' }), result);
  };

  const handleSubmitLowerScore = async () => {
    const profileProjection = buildLeaderboardProfileProjection(loadPhysicalProfile());
    const result = await submitLeaderboardScore({
      entitlement,
      input: {
        uid,
        metric,
        score: Math.max(0, score - 1),
        displayName,
        profile: profileProjection ?? undefined,
      },
    });
    setLastSubmitResult(result);
    addLog(t('debugSubmitLowerAction', { ns: 'common' }), result);
  };

  return (
    <main className="ui-shell flex min-h-screen flex-col gap-5 text-zinc-100">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('debugTitle', { ns: 'common' })}</h1>
          <p className="text-sm text-zinc-300">{t('debugSubtitle', { ns: 'common' })}</p>
        </div>
        <button type="button" onClick={onBack} className="ui-btn">
          {t('back', { ns: 'common' })}
        </button>
      </header>

      <section className="ui-card grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="ui-section-title">{t('debugEntitlement', { ns: 'common' })}</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="ui-btn" onClick={() => setPurchaseStatus('none')}>
              {t('debugSetCoreNone', { ns: 'common' })}
            </button>
            <button type="button" className="ui-btn" onClick={() => setPurchaseStatus('owned')}>
              {t('debugSetCoreOwned', { ns: 'common' })}
            </button>
            <button type="button" className="ui-btn" onClick={() => setSubscriptionStatus('free')}>
              {t('debugSetFree', { ns: 'common' })}
            </button>
            <button
              type="button"
              className="ui-btn"
              onClick={() => {
                setSubscriptionStatus('grace');
                setProExpiry(new Date(Date.now() + 1000 * 60 * 30).toISOString());
              }}
            >
              {t('debugSetGrace', { ns: 'common' })}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              onClick={() => setSubscriptionStatus('pro')}
            >
              {t('debugSetPro', { ns: 'common' })}
            </button>
            <button
              type="button"
              className="ui-btn"
              onClick={() => {
                setSubscriptionStatus('expired');
                setProExpiry(new Date(Date.now() - 1000 * 60).toISOString());
              }}
            >
              {t('debugSetExpired', { ns: 'common' })}
            </button>
          </div>
          <pre className="overflow-auto rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-300">
            {JSON.stringify(entitlement, null, 2)}
          </pre>
        </div>

        <div className="space-y-2 text-sm">
          <h2 className="ui-section-title">{t('debugGuardState', { ns: 'common' })}</h2>
          <p>
            {t('debugHasCore', { ns: 'common' })}: {String(hasCoreAccess(entitlement))}
          </p>
          <p>
            {t('debugCanRead', { ns: 'common' })}: {String(canAccessLeaderboard(entitlement))}
          </p>
          <p>
            {t('debugCanWrite', { ns: 'common' })}: {String(canUploadLeaderboard(entitlement))}
          </p>
          <p>
            {t('debugBlockRead', { ns: 'common' })}: {String(readBlocked)}
          </p>
          <p>
            {t('debugBlockWrite', { ns: 'common' })}: {String(writeBlocked)}
          </p>
          <p>
            {t('debugReadReason', { ns: 'common' })}: {reasonRead}
          </p>
          <p>
            {t('debugWriteReason', { ns: 'common' })}: {reasonWrite}
          </p>
        </div>
      </section>

      <section className="ui-card grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="ui-section-title">{t('debugInput', { ns: 'common' })}</h2>
          <label className="block text-xs text-zinc-400">
            {t('debugMetric', { ns: 'common' })}
          </label>
          <select
            className="ui-input"
            value={metric}
            onChange={(event) => setMetric(event.target.value as DebugMetric)}
          >
            {METRICS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <label className="block text-xs text-zinc-400">{t('debugUid', { ns: 'common' })}</label>
          <input
            className="ui-input"
            value={uid}
            onChange={(event) => setUid(event.target.value)}
          />
          <label className="block text-xs text-zinc-400">
            {t('debugDisplayName', { ns: 'common' })}
          </label>
          <input
            className="ui-input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <label className="block text-xs text-zinc-400">{t('debugScore', { ns: 'common' })}</label>
          <input
            type="number"
            className="ui-input"
            value={score}
            onChange={(event) => setScore(Number(event.target.value))}
          />
          <label className="block text-xs text-zinc-400">{t('debugPage', { ns: 'common' })}</label>
          <input
            type="number"
            min={1}
            className="ui-input"
            value={page}
            onChange={(event) => setPage(Math.max(1, Number(event.target.value) || 1))}
          />
        </div>

        <div className="space-y-3">
          <h2 className="ui-section-title">{t('debugActions', { ns: 'common' })}</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleListLeaderboard} className="ui-btn">
              {t('debugList', { ns: 'common' })}
            </button>
            <button type="button" onClick={handleSubmitScore} className="ui-btn ui-btn-primary">
              {t('debugSubmit', { ns: 'common' })}
            </button>
            <button type="button" onClick={handleSubmitLowerScore} className="ui-btn">
              {t('debugSubmitLower', { ns: 'common' })}
            </button>
            <button
              type="button"
              onClick={() => {
                clearLeaderboardCache(metric);
                addLog(t('debugClearCacheAction', { ns: 'common' }), { metric });
              }}
              className="ui-btn"
            >
              {t('debugClearCache', { ns: 'common' })}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            {t('debugCacheProbe', { ns: 'common' })}:{' '}
            {cacheProbe
              ? t('debugCacheHit', { ns: 'common' })
              : t('debugCacheMiss', { ns: 'common' })}
          </p>
          <div className="grid gap-2">
            <p className="text-xs font-semibold text-zinc-300">
              {t('debugLastListResult', { ns: 'common' })}
            </p>
            <pre className="max-h-40 overflow-auto rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-300">
              {JSON.stringify(lastListResult, null, 2)}
            </pre>
            <p className="text-xs font-semibold text-zinc-300">
              {t('debugLastSubmitResult', { ns: 'common' })}
            </p>
            <pre className="max-h-40 overflow-auto rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-300">
              {JSON.stringify(lastSubmitResult, null, 2)}
            </pre>
          </div>
        </div>
      </section>

      <section className="ui-card">
        <h2 className="mb-2 ui-section-title">{t('debugLogs', { ns: 'common' })}</h2>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-xs text-zinc-500">{t('debugNoLogs', { ns: 'common' })}</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-zinc-800 bg-black/40 p-3">
                <p className="text-xs text-zinc-200">{log.label}</p>
                <pre className="mt-1 overflow-auto text-xs text-zinc-400">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
