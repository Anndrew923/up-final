import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { DisclosurePanel } from '../components/DisclosurePanel';
import { VehicleSpecificationCodex } from '../components/tools/VehicleSpecificationCodex';
import LeaderboardGateSheet from '../components/ladder/LeaderboardGateSheet';
import { useVehicleCodexScores } from '../hooks/useVehicleCodexScores';
import { useUiGate } from '../hooks/useUiGate';
import { joinArenaPath } from '../lib/joinArenaNavigation';
import { gateSheetKindFromUiGate } from '../lib/uiGatePresentation';
import { navigateFromUiGate } from '../lib/uiGateNavigation';
import { ROUTES } from '../config/routes';
import { backupLocalToCloud, restoreCloudToLocal } from '../services/cloudSyncService';

export default function ToolsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncGateOpen, setSyncGateOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [syncInfoOpen, setSyncInfoOpen] = useState(false);
  const codexScores = useVehicleCodexScores();
  const syncUiGate = useUiGate('cloud-sync');
  const syncGateKind = gateSheetKindFromUiGate(syncUiGate);

  const handleBackup = async () => {
    if (syncUiGate.kind !== 'none') {
      setSyncGateOpen(true);
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
    if (syncUiGate.kind !== 'none') {
      setSyncGateOpen(true);
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
    <main className="ui-shell relative max-w-3xl space-y-6 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="ui-tools-backdrop absolute inset-0 opacity-[0.05]" />
      </div>

      <header className="space-y-2">
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
            </Link>
            <Link
              to={ROUTES.plateCalculator}
              className="group rounded-xl border border-accent-primary/25 bg-black/25 p-4 transition hover:border-accent-primary/45 hover:bg-black/40"
            >
              <p className="text-sm font-semibold text-zinc-100">
                {t('tools.calculators.plates.title', { ns: 'common' })}
              </p>
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
          <DisclosurePanel
            instanceId="tools-vehicle-codex"
            expanded={codexOpen}
            onToggle={() => setCodexOpen((open) => !open)}
            title={t('tools.codex.panelTitle', { ns: 'common' })}
            toggleExpandLabel={t('assessment.referenceInfo.toggleExpand', { ns: 'common' })}
            toggleCollapseLabel={t('assessment.referenceInfo.toggleCollapse', { ns: 'common' })}
            panelBodyClassName="space-y-3 px-0 pb-2 pt-2"
          >
            <VehicleSpecificationCodex currentScores={codexScores} />
          </DisclosurePanel>
        </article>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-accent-primary/25 bg-gradient-to-br from-bg-card via-bg-panel to-bg-card p-8 shadow-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/45 to-transparent" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-accent-primary">
          {t('tools.syncTitle', { ns: 'common' })}
        </h2>
        <div className="mt-4">
          <DisclosurePanel
            instanceId="tools-cloud-sync-info"
            expanded={syncInfoOpen}
            onToggle={() => setSyncInfoOpen((open) => !open)}
            title={t('tools.syncInfo.panelTitle', { ns: 'common' })}
            toggleExpandLabel={t('tools.syncInfo.toggleExpand', { ns: 'common' })}
            toggleCollapseLabel={t('tools.syncInfo.toggleCollapse', { ns: 'common' })}
            panelBodyClassName="space-y-3 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-400"
          >
            <p>{t('tools.syncInfo.intro', { ns: 'common' })}</p>
            <p className="font-medium text-zinc-300">{t('tools.syncInfo.scopeIntro', { ns: 'common' })}</p>
            <ul className="list-inside list-disc space-y-1">
              <li>{t('tools.syncInfo.scopeScores', { ns: 'common' })}</li>
              <li>{t('tools.syncInfo.scopeInputs', { ns: 'common' })}</li>
              <li>{t('tools.syncInfo.scopeProfile', { ns: 'common' })}</li>
              <li>{t('tools.syncInfo.scopeHistory', { ns: 'common' })}</li>
            </ul>
            <p>{t('tools.syncInfo.backupNote', { ns: 'common' })}</p>
            <p className="text-amber-200/80">{t('tools.syncInfo.restoreWarning', { ns: 'common' })}</p>
            <p className="text-zinc-500">{t('tools.syncInfo.requirements', { ns: 'common' })}</p>
          </DisclosurePanel>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="ui-btn ui-btn-primary" onClick={handleBackup}>
            {t('tools.syncBackup', { ns: 'common' })}
          </button>
          <button type="button" className="ui-btn" onClick={handleRestore}>
            {t('tools.syncRestore', { ns: 'common' })}
          </button>
          <Link to={joinArenaPath('backup')} className="ui-btn inline-flex border-zinc-600">
            {t('tools.syncUpgrade', { ns: 'common' })}
          </Link>
        </div>
        {syncMsg ? <p className="mt-4 text-sm text-zinc-300">{syncMsg}</p> : null}
      </section>
      {syncGateKind ? (
        <LeaderboardGateSheet
          open={syncGateOpen}
          kind={syncGateKind}
          description={t(`tools.syncGateSheet.${syncGateKind}.body`, { ns: 'common' })}
          secondaryLabel={t('gateSheet.secondary', { ns: 'common' })}
          onSecondary={() => setSyncGateOpen(false)}
          onPrimary={() => {
            setSyncGateOpen(false);
            navigateFromUiGate(navigate, syncUiGate, ROUTES.tools);
          }}
        />
      ) : null}
    </main>
  );
}
