import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SIX_AXIS_SNAPSHOT_LEFT_AXES,
  SIX_AXIS_SNAPSHOT_RIGHT_AXES,
} from '../../config/assessmentLobby';
import type { ScoreMap, SixAxisMetric } from '../../types/scoring';
import { DisclosurePanel } from '../DisclosurePanel';

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
 * Collapsed-by-default read-only six-axis board for the Dyno lobby.
 * WHY: Keep the assessment card grid visually light; telemetry + archive stay one intentional expand away.
 */
export const DynoSixAxisSnapshotPanel: FC<DynoSixAxisSnapshotPanelProps> = ({
  scores,
  justSaved = false,
  onSaveSnapshot,
}) => {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);

  return (
    <DisclosurePanel
      instanceId="dyno-six-axis-snapshot"
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      title={t('assessment.sixAxisSnapshot.title')}
      toggleExpandLabel={t('assessment.sixAxisSnapshot.toggleExpand')}
      toggleCollapseLabel={t('assessment.sixAxisSnapshot.toggleCollapse')}
      actionMode="chevron"
      panelBodyClassName="space-y-4 px-4 pb-4 pt-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <AxisColumn metrics={SIX_AXIS_SNAPSHOT_LEFT_AXES} scores={scores} t={t} />
        <AxisColumn metrics={SIX_AXIS_SNAPSHOT_RIGHT_AXES} scores={scores} t={t} />
      </div>

      <div className="space-y-2 border-t border-zinc-800/80 pt-3">
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
  );
};

export default DynoSixAxisSnapshotPanel;
