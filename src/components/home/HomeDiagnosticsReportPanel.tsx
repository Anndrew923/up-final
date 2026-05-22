import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useDiagnosticsReportEntrance } from '../../hooks/useDiagnosticsReportEntrance';
import { resolveIdentityString } from '../../i18n/resolveCoreBundleCopy';
import { resolveHomeLeafString } from '../../i18n/resolveHomeLeafCopy';
import { resolveHomeSectionString } from '../../i18n/resolveHomeBundleCopy';
import {
  DIAGNOSTICS_PANEL_TRANSITION,
  DIAGNOSTICS_STAGGER_DELAY_MS,
  DIAGNOSTICS_STAGGER_TRANSITION,
  diagnosticsPanelVisible,
  diagnosticsStaggerVisible,
  diagnosticsWillChange,
} from '../../lib/diagnosticsReportMotion';
import { formatOverallResonanceScore } from '../../logic/core/scoring';
import type { HomeResonanceSnapshot } from '../../types/homeResonance';
import { buildIdentityLiveSpecRows } from './identityLiveSpecRows';
import IdentityLiveSpecList from './IdentityLiveSpecList';

export interface HomeDiagnosticsReportPanelProps {
  snapshot: HomeResonanceSnapshot;
  onClose: () => void;
}

/**
 * Scrollable global spec report with panel + staggered entrance.
 * WHY: rAF-triggered transitions avoid iOS WebView keyframe+backdrop-filter bugs that left opacity stuck at 0.
 */
const HomeDiagnosticsReportPanel: FC<HomeDiagnosticsReportPanelProps> = ({
  snapshot,
  onClose,
}) => {
  const { t } = useTranslation('common');
  const { entered, motionActive } = useDiagnosticsReportEntrance();
  const reportTitle = resolveHomeSectionString(t, 'resonance', 'reportTitle');
  const closeLabel = resolveHomeSectionString(t, 'resonance', 'close');
  const gradeKickerLabel = resolveHomeSectionString(t, 'overallGrade', 'kicker');
  const overallAverageLabel = resolveHomeLeafString(t, 'overallAverage');
  const liveSpecKicker = resolveIdentityString(t, 'liveSpecKicker');
  const liveSpecRows = useMemo(
    () => buildIdentityLiveSpecRows(t, snapshot.radarPoints),
    [snapshot.radarPoints, t]
  );

  const gpu = diagnosticsWillChange(motionActive);

  return (
    <div
      className={`relative flex max-h-[min(72vh,640px)] flex-col ${DIAGNOSTICS_PANEL_TRANSITION} ${gpu} ${diagnosticsPanelVisible(entered)}`}
    >
      <div
        className={`shrink-0 space-y-3 border-b border-zinc-800/80 pb-4 ${DIAGNOSTICS_STAGGER_TRANSITION} ${gpu} ${diagnosticsStaggerVisible(entered, 'y')}`}
        style={{ transitionDelay: entered ? `${DIAGNOSTICS_STAGGER_DELAY_MS.header}ms` : '0ms' }}
      >
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-primary/90">
            {reportTitle}
          </p>
          <h2 className="text-base font-semibold tracking-tight text-zinc-50">
            {snapshot.archetypeTitle}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">{snapshot.archetypeSummary}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            {overallAverageLabel}
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-accent-info">
            {formatOverallResonanceScore(snapshot.overallScore)}
          </p>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-4 ${DIAGNOSTICS_STAGGER_TRANSITION} ${gpu} ${diagnosticsStaggerVisible(entered, 'x')}`}
        style={{ transitionDelay: entered ? `${DIAGNOSTICS_STAGGER_DELAY_MS.body}ms` : '0ms' }}
      >
        <div className="border-b border-zinc-800/80 pb-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            {gradeKickerLabel}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-200">
            {snapshot.gradeLine}
          </p>
        </div>

        <IdentityLiveSpecList
          variant="overlay"
          kickerId="identity-live-spec-kicker-report"
          kicker={liveSpecKicker}
          rows={liveSpecRows}
        />
      </div>

      <div
        className={`shrink-0 border-t border-zinc-800/80 pt-4 ${DIAGNOSTICS_STAGGER_TRANSITION} ${gpu} ${diagnosticsStaggerVisible(entered, 'y')}`}
        style={{ transitionDelay: entered ? `${DIAGNOSTICS_STAGGER_DELAY_MS.footer}ms` : '0ms' }}
      >
        <button type="button" className="ui-btn ui-btn-primary h-11 w-full" onClick={onClose}>
          {closeLabel}
        </button>
      </div>
    </div>
  );
};

export default HomeDiagnosticsReportPanel;
