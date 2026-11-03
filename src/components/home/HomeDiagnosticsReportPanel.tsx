import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import HexRadarChart from '../radar/HexRadarChart';
import { useDiagnosticsReportEntrance } from '../../hooks/useDiagnosticsReportEntrance';
import { resolveHomeSectionString } from '../../i18n/resolveHomeBundleCopy';
import { resolveHomeLeafString } from '../../i18n/resolveHomeLeafCopy';
import {
  buildOverallGradeDetailRows,
  resolveOverallGradeTierCopy,
} from '../../i18n/resolveOverallGradeCopy';
import {
  DIAGNOSTICS_PANEL_TRANSITION,
  DIAGNOSTICS_REPORT_CTA_SAFE_BOTTOM_CLASS,
  DIAGNOSTICS_REPORT_SCROLL_PAD_CLASS,
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
  scaleMax: number;
  onClose: () => void;
}

/** Soft tachometer tick geometry — precomputed so INDEX hero avoids per-render trig. */
const INDEX_TICK_LINES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
  const outer = 56;
  const inner = i % 6 === 0 ? 46 : 50;
  return {
    key: i,
    major: i % 6 === 0,
    x1: 60 + Math.cos(angle) * inner,
    y1: 60 + Math.sin(angle) * inner,
    x2: 60 + Math.cos(angle) * outer,
    y2: 60 + Math.sin(angle) * outer,
  };
});

/** Soft tachometer tick marks behind the INDEX readout — presentational only. */
const IndexTickMarks: FC = () => (
  <svg
    className="pointer-events-none absolute inset-0 size-full opacity-[0.22]"
    viewBox="0 0 120 120"
    aria-hidden
  >
    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-cyan-400/40" />
    <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-400/30" />
    {INDEX_TICK_LINES.map((tick) => (
      <line
        key={tick.key}
        x1={tick.x1}
        y1={tick.y1}
        x2={tick.x2}
        y2={tick.y2}
        stroke="currentColor"
        strokeWidth={tick.major ? 1.1 : 0.6}
        className="text-cyan-300/50"
      />
    ))}
  </svg>
);

const CORNER_MARK =
  'pointer-events-none absolute font-mono text-[10px] leading-none text-zinc-500/80';

const CTA_CLIP =
  '[clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]';

/**
 * Scrollable global spec report with panel + staggered entrance.
 * WHY: rAF-triggered transitions avoid iOS WebView keyframe+backdrop-filter bugs that left opacity stuck at 0.
 * Sticky mechanical CTA stays resident; scroll body only carries readout + bento.
 */
const HomeDiagnosticsReportPanel: FC<HomeDiagnosticsReportPanelProps> = ({
  snapshot,
  scaleMax,
  onClose,
}) => {
  const { t, i18n } = useTranslation('common');
  const { entered, motionActive } = useDiagnosticsReportEntrance();
  const reportTitle = resolveHomeSectionString(t, 'resonance', 'reportTitle');
  const closeLabel = resolveHomeSectionString(t, 'resonance', 'close');
  const ctaReadyLabel = resolveHomeSectionString(t, 'resonance', 'ctaReady');
  const indexPtsLabel = resolveHomeSectionString(t, 'resonance', 'indexPts');
  const liveSpecKicker = resolveHomeSectionString(t, 'resonance', 'liveSpecKicker');
  const homologationId = Math.round(snapshot.overallScore * 100);
  const homologationLabel = resolveHomeSectionString(t, 'resonance', 'homologationId', {
    id: homologationId,
  });
  const gradeKickerLabel = resolveHomeSectionString(t, 'overallGrade', 'kicker');
  const overallAverageLabel = resolveHomeLeafString(t, 'overallAverage');
  const labelSeparator = i18n.language === 'zh-Hant' ? '：' : ': ';
  const liveSpecRows = useMemo(
    () => buildIdentityLiveSpecRows(t, snapshot.radarPoints),
    [snapshot.radarPoints, t]
  );
  const gradeCopy = useMemo(
    () => resolveOverallGradeTierCopy(t, snapshot.gradeBandId),
    [snapshot.gradeBandId, t]
  );
  const gradeBenchmarkRows = useMemo(() => {
    return buildOverallGradeDetailRows(t, snapshot.gradeBandId, gradeCopy);
  }, [gradeCopy, snapshot.gradeBandId, t]);

  const gpu = diagnosticsWillChange(motionActive);
  const scoreLabel = formatOverallResonanceScore(snapshot.overallScore);

  return (
    <div
      className={`relative flex max-h-[min(calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2.5rem),720px)] flex-col overflow-hidden ${DIAGNOSTICS_PANEL_TRANSITION} ${gpu} ${diagnosticsPanelVisible(entered)}`}
      data-testid="home-diagnostics-report-panel"
    >
      <span className={`${CORNER_MARK} left-0 top-0`} aria-hidden>
        +
      </span>
      <span className={`${CORNER_MARK} right-0 top-0`} aria-hidden>
        +
      </span>
      <span className={`${CORNER_MARK} bottom-0 left-0`} aria-hidden>
        +
      </span>
      <span className={`${CORNER_MARK} bottom-0 right-0`} aria-hidden>
        +
      </span>

      {/*
        WHY: Scroll carries readout only; sticky cockpit CTA stays visible on SE / 390 / 430.
      */}
      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${DIAGNOSTICS_REPORT_SCROLL_PAD_CLASS}`}
        data-testid="diagnostics-report-scroll"
      >
        <div
          className={`space-y-3 border-b border-zinc-800/80 pb-4 ${DIAGNOSTICS_STAGGER_TRANSITION} ${gpu} ${diagnosticsStaggerVisible(entered, 'y')}`}
          style={{ transitionDelay: entered ? `${DIAGNOSTICS_STAGGER_DELAY_MS.header}ms` : '0ms' }}
        >
          <div className="space-y-1.5">
            <p
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-400/80"
              data-testid="homologation-id"
            >
              {homologationLabel}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent-primary/90">
              {reportTitle}
            </p>
            <h2 className="text-base font-semibold tracking-tight text-zinc-50">
              {snapshot.archetypeTitle}
            </h2>
            <p className="text-xs leading-relaxed text-zinc-400 md:text-sm">
              {snapshot.archetypeSummary}
            </p>
          </div>

          <div
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-4"
            data-testid="diagnostics-report-hero"
          >
            <div className="relative size-[120px] shrink-0 overflow-hidden">
              {/*
                WHY: Mini plaque hides vertex labels (`[&_text]:hidden`) — at 120px full lexicon
                labels clip into the INDEX column and fight the homologation readout.
              */}
              <HexRadarChart
                points={snapshot.radarPoints}
                scaleMax={scaleMax}
                ritualFill={1}
                suppressEntryAnimation
                className="relative z-10 size-full origin-center scale-[0.92] [&_text]:hidden"
                aria-label={t('home.radarAria')}
              />
            </div>

            <div className="relative flex min-h-[120px] flex-col items-end justify-center pr-1">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-end">
                <div className="relative size-[112px]">
                  <IndexTickMarks />
                </div>
              </div>
              <p className="relative z-10 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                {overallAverageLabel}
              </p>
              <p
                className="relative z-10 mt-1 font-mono text-4xl font-semibold tabular-nums text-accent-info"
                data-testid="diagnostics-report-index"
              >
                {scoreLabel}
              </p>
              <p className="relative z-10 mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                {indexPtsLabel}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`py-3 ${DIAGNOSTICS_STAGGER_TRANSITION} ${gpu} ${diagnosticsStaggerVisible(entered, 'x')}`}
          style={{ transitionDelay: entered ? `${DIAGNOSTICS_STAGGER_DELAY_MS.body}ms` : '0ms' }}
        >
          <div className="border-b border-zinc-800/80 pb-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              {gradeKickerLabel}
            </p>
            <p className="mt-1.5 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-100">
              {gradeCopy.name}
            </p>
            {gradeCopy.desc.length > 0 ? (
              <p className="mt-1 text-xs leading-relaxed text-zinc-400 md:text-sm">{gradeCopy.desc}</p>
            ) : null}
            {gradeBenchmarkRows.length > 0 ? (
              <div className="mt-2.5 space-y-1.5 border-l-2 border-accent-info/40 pl-3">
                {gradeBenchmarkRows.map((row) => (
                  <p
                    key={row.label}
                    className="text-xs leading-relaxed tracking-wide text-zinc-400 md:text-sm"
                  >
                    <span className="font-medium text-accent-info/90" aria-hidden>
                      ✦{' '}
                    </span>
                    <span className="font-medium text-zinc-300">
                      {row.label}
                      {labelSeparator}
                    </span>
                    {row.value}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <IdentityLiveSpecList
            kickerId="identity-live-spec-kicker-report"
            kicker={liveSpecKicker}
            rows={liveSpecRows}
          />
        </div>
      </div>

      <div
        className={`sticky bottom-0 z-20 w-full shrink-0 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent px-0 pt-3 ${DIAGNOSTICS_REPORT_CTA_SAFE_BOTTOM_CLASS} ${DIAGNOSTICS_STAGGER_TRANSITION} ${gpu} ${diagnosticsStaggerVisible(entered, 'y')}`}
        style={{ transitionDelay: entered ? `${DIAGNOSTICS_STAGGER_DELAY_MS.footer}ms` : '0ms' }}
        data-testid="diagnostics-report-cta-wrap"
      >
        <button
          type="button"
          className={`relative flex h-12 w-full items-center justify-center gap-2.5 border border-orange-500/80 bg-zinc-900 px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-50 shadow-[0_0_18px_rgba(249,115,22,0.28),inset_0_1px_1px_rgba(255,255,255,0.15)] transition hover:border-orange-400 hover:bg-zinc-900/95 hover:shadow-[0_0_24px_rgba(249,115,22,0.4)] active:translate-y-px active:scale-[0.985] ${CTA_CLIP}`}
          onClick={onClose}
          data-testid="diagnostics-report-confirm"
        >
          <span
            className="inline-flex shrink-0 items-center gap-1.5 text-[10px] tracking-[0.14em] text-orange-300/90"
            aria-hidden
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
            {ctaReadyLabel}
          </span>
          <span className="min-w-0 truncate">{closeLabel}</span>
        </button>
      </div>
    </div>
  );
};

export default HomeDiagnosticsReportPanel;
