import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SIX_AXIS_SNAPSHOT_LEFT_AXES,
  SIX_AXIS_SNAPSHOT_RIGHT_AXES,
} from '../../config/assessmentLobby';
import type { ScoreMap, SixAxisMetric } from '../../types/scoring';
import { DisclosurePanel } from '../DisclosurePanel';
import { DynoSixAxisRadarIcon } from './DynoSixAxisRadarIcon';

export interface DynoSixAxisSnapshotPanelProps {
  scores: ScoreMap;
  justSaved?: boolean;
  onSaveSnapshot: () => void;
}

function formatAxisValue(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

interface AxisReadoutProps {
  label: string;
  value: number | undefined;
}

const AxisReadout: FC<AxisReadoutProps> = ({ label, value }) => (
  <div className="space-y-1 rounded-xl border border-zinc-800/70 bg-zinc-950/40 px-3 py-2.5">
    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    <p className="font-mono text-sm tabular-nums text-zinc-300">{formatAxisValue(value)}</p>
  </div>
);

function AxisColumn({
  metrics,
  scores,
  t,
}: {
  metrics: readonly SixAxisMetric[];
  scores: ScoreMap;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-3">
      {metrics.map((metric) => (
        <AxisReadout
          key={metric}
          label={t(`axisLexicon.output.full.${metric}`)}
          value={scores[metric]}
        />
      ))}
    </div>
  );
}

/**
 * Collapsed-by-default HUD entry for Dyno six-axis telemetry + archive.
 * WHY: High-presence amber/cyan shell so the snapshot is a glanceable war-room affordance,
 * not a flat accordion twin of the lobby cards.
 */
export const DynoSixAxisSnapshotPanel: FC<DynoSixAxisSnapshotPanelProps> = ({
  scores,
  justSaved = false,
  onSaveSnapshot,
}) => {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-6 top-0 z-10 h-px bg-gradient-to-r from-transparent via-amber-400/55 to-transparent"
        aria-hidden
      />
      <DisclosurePanel
        instanceId="dyno-six-axis-snapshot"
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        title={
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/35 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.18)]">
              <DynoSixAxisRadarIcon className="size-4" />
            </span>
            <span className="min-w-0 truncate font-semibold tracking-tight text-zinc-50">
              {t('assessment.sixAxisSnapshot.title')}
            </span>
            <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/80 sm:inline">
              {t('assessment.sixAxisSnapshot.hudHint')}
            </span>
          </span>
        }
        toggleExpandLabel={t('assessment.sixAxisSnapshot.toggleExpand')}
        toggleCollapseLabel={t('assessment.sixAxisSnapshot.toggleCollapse')}
        collapsedHint={t('assessment.sixAxisSnapshot.collapsedHint')}
        actionMode="chevron"
        shellClassName="relative overflow-hidden rounded-xl border border-amber-500/35 bg-gradient-to-br from-amber-950/30 via-zinc-950/80 to-cyan-950/25 shadow-[0_0_28px_rgba(245,158,11,0.12),0_0_20px_rgba(34,211,238,0.06)]"
        headerClassName="hover:bg-amber-500/[0.06]"
        panelBodyClassName="space-y-4 px-4 pb-4 pt-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <AxisColumn metrics={SIX_AXIS_SNAPSHOT_LEFT_AXES} scores={scores} t={t} />
          <AxisColumn metrics={SIX_AXIS_SNAPSHOT_RIGHT_AXES} scores={scores} t={t} />
        </div>

        <div className="space-y-2 border-t border-amber-500/20 pt-3">
          <button
            type="button"
            className="ui-btn ui-btn-primary w-full text-sm sm:w-auto"
            onClick={onSaveSnapshot}
          >
            {t('assessment.sixAxisSnapshot.saveSnapshot')}
          </button>
          {justSaved ? (
            <p className="text-xs text-accent-info" role="status">
              {t('assessment.sixAxisSnapshot.saveDone')}
            </p>
          ) : null}
        </div>
      </DisclosurePanel>
    </div>
  );
};

export default DynoSixAxisSnapshotPanel;
