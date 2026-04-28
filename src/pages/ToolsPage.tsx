import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import LeaderboardGateSheet from '../components/ladder/LeaderboardGateSheet';
import { ROUTES } from '../config/routes';
import { hasProAccess } from '../logic/core/entitlement';
import { backupLocalToCloud, restoreCloudToLocal } from '../services/cloudSyncService';
import type { EntitlementState } from '../types/entitlement';
import { useEntitlementStore } from '../stores/entitlementStore';
import { useAuthStore } from '../stores/authStore';
import { useShallow } from 'zustand/react/shallow';

export default function ToolsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncGateType, setSyncGateType] = useState<'auth' | 'pro' | null>(null);

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

  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const proReady = hasProAccess(entitlement);
  const loginReady = authStatus === 'signed-in' && !isAnonymous;

  const resolveSyncGate = (): 'auth' | 'pro' | null => {
    if (!loginReady) return 'auth';
    if (!proReady) return 'pro';
    return null;
  };

  const handleBackup = async () => {
    const gate = resolveSyncGate();
    if (gate) {
      setSyncGateType(gate);
      return;
    }
    setSyncMsg(null);
    const r = await backupLocalToCloud();
    if (r.ok) {
      setSyncMsg(t('tools.sync.backupOk', { ns: 'common' }));
      return;
    }
    if (r.reason === 'auth-failed') {
      setSyncMsg(t('tools.sync.authFail', { ns: 'common' }));
      return;
    }
    if (r.reason === 'unavailable') {
      setSyncMsg(t('tools.sync.unavailable', { ns: 'common' }));
      return;
    }
    if (r.reason === 'permission-denied') {
      setSyncMsg(t('tools.sync.permissionDenied', { ns: 'common' }));
      return;
    }
    setSyncMsg(t('tools.sync.backupFail', { ns: 'common' }));
  };

  const handleRestore = async () => {
    const gate = resolveSyncGate();
    if (gate) {
      setSyncGateType(gate);
      return;
    }
    setSyncMsg(null);
    const r = await restoreCloudToLocal();
    if (r.ok) {
      setSyncMsg(t('tools.sync.restoreOk', { ns: 'common' }));
      return;
    }
    if (r.reason === 'empty-restore') {
      setSyncMsg(t('tools.sync.restoreEmpty', { ns: 'common' }));
      return;
    }
    if (r.reason === 'auth-failed') {
      setSyncMsg(t('tools.sync.authFail', { ns: 'common' }));
      return;
    }
    if (r.reason === 'unavailable') {
      setSyncMsg(t('tools.sync.unavailable', { ns: 'common' }));
      return;
    }
    if (r.reason === 'permission-denied') {
      setSyncMsg(t('tools.sync.permissionDenied', { ns: 'common' }));
      return;
    }
    setSyncMsg(t('tools.sync.restoreFail', { ns: 'common' }));
  };

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden>
        <div className="ui-tools-backdrop absolute inset-0" />
      </div>

      <div className="ui-shell relative max-w-3xl space-y-10">
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
            {t('tools.kicker', { ns: 'common' })}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            {t('tools.title', { ns: 'common' })}
          </h1>
        </header>

        <section className="grid gap-6">
          <article className="rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">
              {t('tools.calculators.title', { ns: 'common' })}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to={ROUTES.oneRmCalculator}
                className="group rounded-xl border border-accent-primary/25 bg-black/25 p-4 transition hover:border-accent-primary/45 hover:bg-black/40"
              >
                <p className="text-sm font-semibold text-zinc-100">
                  {t('tools.calculators.oneRm.title', { ns: 'common' })}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {t('tools.calculators.oneRm.cardBody', { ns: 'common' })}
                </p>
              </Link>
              <Link
                to={ROUTES.plateCalculator}
                className="group rounded-xl border border-accent-primary/25 bg-black/25 p-4 transition hover:border-accent-primary/45 hover:bg-black/40"
              >
                <p className="text-sm font-semibold text-zinc-100">
                  {t('tools.calculators.plates.title', { ns: 'common' })}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {t('tools.calculators.plates.cardBody', { ns: 'common' })}
                </p>
              </Link>
            </div>
          </article>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-accent-primary/25 bg-gradient-to-br from-bg-card via-bg-panel to-bg-card p-8 shadow-panel">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/45 to-transparent" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-accent-primary">
            {t('tools.syncTitle', { ns: 'common' })}
          </h2>
          <p className="mt-3 text-sm text-zinc-400">{t('tools.syncBody', { ns: 'common' })}</p>
          {!proReady ? (
            <p className="mt-4 rounded-lg border border-zinc-800 bg-black/30 px-3 py-2 text-xs text-amber-200/90">
              {t('tools.syncProOnly', { ns: 'common' })}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              onClick={handleBackup}
            >
              {t('tools.syncBackup', { ns: 'common' })}
            </button>
            <button type="button" className="ui-btn" onClick={handleRestore}>
              {t('tools.syncRestore', { ns: 'common' })}
            </button>
            <Link to={ROUTES.joinArena} className="ui-btn inline-flex border-zinc-600">
              {t('tools.syncUpgrade', { ns: 'common' })}
            </Link>
          </div>
          {syncMsg ? <p className="mt-4 text-sm text-zinc-300">{syncMsg}</p> : null}
        </section>
        <LeaderboardGateSheet
          open={syncGateType !== null}
          title={t(
            syncGateType === 'auth'
              ? 'tools.syncGateSheet.auth.title'
              : 'tools.syncGateSheet.pro.title',
            { ns: 'common' }
          )}
          description={t(
            syncGateType === 'auth'
              ? 'tools.syncGateSheet.auth.body'
              : 'tools.syncGateSheet.pro.body',
            { ns: 'common' }
          )}
          primaryLabel={t(
            syncGateType === 'auth'
              ? 'tools.syncGateSheet.auth.primary'
              : 'tools.syncGateSheet.pro.primary',
            { ns: 'common' }
          )}
          secondaryLabel={t('tools.syncGateSheet.secondary', { ns: 'common' })}
          onSecondary={() => setSyncGateType(null)}
          onPrimary={() => {
            const gate = syncGateType;
            setSyncGateType(null);
            if (gate === 'auth') {
              navigate(ROUTES.authChoice, { state: { returnTo: ROUTES.tools } });
              return;
            }
            navigate(ROUTES.joinArena);
          }}
        />
      </div>
    </main>
  );
}
