import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { hasProAccess } from '../logic/core/entitlement';
import { backupLocalToCloud, restoreCloudToLocal } from '../services/cloudSyncService';
import type { EntitlementState } from '../types/entitlement';
import { useEntitlementStore } from '../stores/entitlementStore';
import { useShallow } from 'zustand/react/shallow';

export default function ToolsPage() {
  const { t } = useTranslation();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

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

  const proReady = hasProAccess(entitlement);

  const handleBackup = async () => {
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
    setSyncMsg(t('tools.sync.backupFail', { ns: 'common' }));
  };

  const handleRestore = async () => {
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
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
            {t('tools.subtitle', { ns: 'common' })}
          </p>
        </header>

        <section className="grid gap-6">
          <article className="rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">
              {t('tools.moduleConsole', { ns: 'common' })}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              {t('tools.consoleBody', { ns: 'common' })}
            </p>
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
              disabled={!proReady}
            >
              {t('tools.syncBackup', { ns: 'common' })}
            </button>
            <button type="button" className="ui-btn" onClick={handleRestore} disabled={!proReady}>
              {t('tools.syncRestore', { ns: 'common' })}
            </button>
            <Link to={ROUTES.joinArena} className="ui-btn inline-flex border-zinc-600">
              {t('tools.syncUpgrade', { ns: 'common' })}
            </Link>
          </div>
          {syncMsg ? <p className="mt-4 text-sm text-zinc-300">{syncMsg}</p> : null}
        </section>
      </div>
    </main>
  );
}
