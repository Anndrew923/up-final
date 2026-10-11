import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DisclosurePanel } from '../components/DisclosurePanel';
import { VehicleSpecificationCodex } from '../components/tools/VehicleSpecificationCodex';
import CloudSyncCard from '../components/tools/CloudSyncCard';
import { ShellFlowStack } from '../components/layout/ShellFlowStack';
import { useCloudSyncCard } from '../hooks/useCloudSyncCard';
import { useVehicleCodexScores } from '../hooks/useVehicleCodexScores';
import { ROUTES } from '../config/routes';

export default function ToolsPage() {
  const { t } = useTranslation();
  const [codexOpen, setCodexOpen] = useState(false);
  const codexScores = useVehicleCodexScores();
  const cloudSync = useCloudSyncCard();

  return (
    <main className="ui-shell-compact relative max-w-3xl text-zinc-100">
      {/*
        WHY decor outside space-y: Absolute backdrop still counts as a space-y sibling
        and would margin-push the header. Stack only in-flow content — no CSS sibling hacks.
      */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="ui-tools-backdrop absolute inset-0 opacity-[0.05]" />
      </div>

      <ShellFlowStack gapClassName="space-y-4">
        <header className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
            {t('tools.kicker', { ns: 'common' })}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            {t('tools.title', { ns: 'common' })}
          </h1>
        </header>

        <section className="grid gap-4">
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
              <Link
                to={ROUTES.somatotypeLab}
                aria-label={t('tools.somatotypeLab.title', { ns: 'common' })}
                className="group rounded-xl border border-accent-primary/25 bg-black/25 p-4 transition hover:border-accent-primary/45 hover:bg-black/40 sm:col-span-2"
              >
                <p className="text-sm font-semibold text-zinc-100">
                  {t('tools.somatotypeLab.title', { ns: 'common' })}
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
              actionMode="chevron"
              panelBodyClassName="space-y-3 px-0 pb-2 pt-2"
            >
              <VehicleSpecificationCodex currentScores={codexScores} />
            </DisclosurePanel>
          </article>
        </section>

        <CloudSyncCard {...cloudSync} />
      </ShellFlowStack>
    </main>
  );
}
