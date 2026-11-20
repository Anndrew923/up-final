/**
 * LOGS self-comparison dual radar + share CTA.
 *
 * WHY: Presentational only — deltas / Day-1 resolution live in
 * `buildLogEvolutionReport`; PNG encode + Share Sheet live in the share hook.
 * Header matches Rhythm / Archive height: title + [share Icon][chevron] only.
 */
import { useId, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { LogEvolutionReport } from '../../logic/core/logEvolutionReport';
import { buildSixAxisRadarData, radarDisplayScaleMax } from '../../logic/core/scoring';
import { resolveSixAxisChartLabel } from '../../i18n/resolveSixAxisChartLabel';
import { formatAxisScoreReadout } from '../../logic/core/formatAxisScoreReadout';
import { formatEvolutionCardDate } from '../../logic/core/formatEvolutionCardDate';
import { formatSignedDelta } from '../../logic/core/formatSignedDelta';
import type { SixAxisMetric } from '../../types/scoring';
import { CollapsibleChevron } from '../CollapsibleChevron';
import HexRadarChart from '../radar/HexRadarChart';
import {
  HISTORY_COLLAPSIBLE_CHROME as chrome,
  HISTORY_SECTION_DEFAULT_EXPANDED,
} from './historyCollapsibleChrome';

export interface LogEvolutionCardProps {
  report: LogEvolutionReport;
  sharing?: boolean;
  onShare?: () => void;
  onSelectDay1Baseline: () => void;
  onSelectPreviousLog: () => void;
}

/** Lucide-style Share2 paths — no lucide-react dependency in this package. */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49" />
      <path d="M15.41 6.51 8.59 10.49" />
    </svg>
  );
}

function ShareSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`${className ?? ''} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V2C5.373 2 2 5.373 2 12h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-1.647z"
      />
    </svg>
  );
}

const LogEvolutionCard: FC<LogEvolutionCardProps> = ({
  report,
  sharing = false,
  onShare,
  onSelectDay1Baseline,
  onSelectPreviousLog,
}) => {
  const { t } = useTranslation('common');
  const empty = t('history.valueEmpty');
  const toggleId = useId();
  const panelId = useId();
  // WHY: First-screen density — three LOGS sections open as summary pills; expand on demand.
  const [expanded, setExpanded] = useState(HISTORY_SECTION_DEFAULT_EXPANDED);

  const currentPoints = useMemo(() => {
    if (!expanded || !report.current) return [];
    return buildSixAxisRadarData(report.current.scores).map((point) => ({
      ...point,
      label: resolveSixAxisChartLabel(t, point.key as SixAxisMetric),
    }));
  }, [expanded, report.current, t]);

  const baselinePoints = useMemo(() => {
    if (!expanded || !report.baseline || report.mode !== 'comparing') return undefined;
    return buildSixAxisRadarData(report.baseline.scores).map((point) => ({
      ...point,
      label: resolveSixAxisChartLabel(t, point.key as SixAxisMetric),
    }));
  }, [expanded, report.baseline, report.mode, t]);

  const scaleMax = useMemo(() => {
    const pool = [...currentPoints, ...(baselinePoints ?? [])];
    return radarDisplayScaleMax(pool.length > 0 ? pool : [{ value: 0 }]);
  }, [baselinePoints, currentPoints]);

  const day1Active = report.selectedBaselineId === report.day1BaselineId;
  const previousDistinct =
    report.previousLogId != null && report.previousLogId !== report.day1BaselineId;
  const previousActive =
    previousDistinct && report.selectedBaselineId === report.previousLogId;

  const baselineDate = formatEvolutionCardDate(report.baseline?.createdAt, empty);
  const currentDate = formatEvolutionCardDate(report.current?.createdAt, empty);
  // WHY: Collapsed pill uses short DAY 1 — EN must not read “Baseline: DAY 1 BASELINE”.
  const baselinePillLabel = day1Active
    ? t('history.evolution.day1BaselineShort')
    : baselineDate;

  const actionLabel = expanded
    ? t('history.evolution.toggleCollapse')
    : t('history.evolution.toggleExpand');
  const shareAriaLabel = sharing
    ? t('history.evolution.sharing')
    : t('history.evolution.shareButton');

  if (!report.current) return null;

  const toggleExpanded = () => setExpanded((v) => !v);
  const handleShare = () => onShare?.();

  const headerActions = (
    <div className={chrome.headerActions}>
      <button
        type="button"
        data-testid="log-evolution-share"
        disabled={sharing || !onShare}
        onClick={handleShare}
        className={chrome.chevronBadge}
        aria-label={shareAriaLabel}
        aria-busy={sharing || undefined}
      >
        {sharing ? (
          <ShareSpinner className={chrome.chevronIcon} />
        ) : (
          <ShareIcon className={chrome.chevronIcon} />
        )}
      </button>
      <button
        type="button"
        id={toggleId}
        data-testid="log-evolution-toggle"
        className={chrome.chevronBadge}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={actionLabel}
        onClick={toggleExpanded}
      >
        <CollapsibleChevron expanded={expanded} className={chrome.chevronIcon} />
      </button>
    </div>
  );

  return (
    <section data-testid="log-evolution-card">
      <div className={chrome.headerPanel}>
        <div className={chrome.headerTopRow}>
          <button
            type="button"
            className={`${chrome.headerTitleStack} text-left transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-info/60`}
            // WHY: Click expands for convenience, but aria-expanded lives only on the
            // chevron (toggleId) so AT don't announce two disclosure controls.
            onClick={toggleExpanded}
          >
            <span className={chrome.kicker}>{t('history.evolution.kicker')}</span>
            <span className={chrome.title}>{t('history.evolution.title')}</span>
          </button>
          {headerActions}
        </div>

        {!expanded ? (
          <button
            type="button"
            className={`${chrome.headerPillsRow} w-full text-left transition hover:opacity-90`}
            data-testid="log-evolution-collapsed-pills"
            aria-controls={panelId}
            onClick={toggleExpanded}
          >
            <span className={chrome.pill}>
              {t('history.evolution.collapsedOverall', {
                from: formatAxisScoreReadout(report.baseline?.overallScore, empty),
                to: formatAxisScoreReadout(report.current.overallScore, empty),
                delta:
                  report.overallDelta != null
                    ? formatSignedDelta(report.overallDelta, empty)
                    : empty,
              })}
            </span>
            <span className={chrome.pill}>
              {t('history.evolution.collapsedBaseline', { label: baselinePillLabel })}
            </span>
          </button>
        ) : null}
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div
          className={`min-h-0 overflow-hidden ${expanded ? '' : 'pointer-events-none'}`}
          inert={expanded ? undefined : true}
        >
          {/* Mount radar only while open — avoids HexRadarChart work on the collapsed first paint. */}
          {expanded ? (
            <div
              id={panelId}
              role="region"
              aria-labelledby={toggleId}
              aria-hidden={false}
            >
              <div
                className="mt-3 flex flex-wrap items-center gap-2"
                data-testid="log-evolution-baseline-switcher"
              >
                <button
                  type="button"
                  data-testid="log-evolution-baseline-day1"
                  onClick={onSelectDay1Baseline}
                  disabled={!report.day1BaselineId}
                  className={`rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition ${
                    day1Active
                      ? 'border-amber-400/55 bg-amber-500/15 text-amber-200'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  } disabled:opacity-40`}
                >
                  {t('history.evolution.day1Baseline')}
                </button>
                <button
                  type="button"
                  data-testid="log-evolution-baseline-previous"
                  onClick={onSelectPreviousLog}
                  disabled={!previousDistinct}
                  className={`rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition ${
                    previousActive
                      ? 'border-amber-400/55 bg-amber-500/15 text-amber-200'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  } disabled:opacity-40`}
                >
                  {t('history.evolution.previousLog')}
                </button>
              </div>

              <div className="mt-3 flex justify-center" data-testid="log-evolution-radar">
                <HexRadarChart
                  points={currentPoints}
                  comparisonPoints={baselinePoints}
                  presentation="ritual"
                  scaleMax={scaleMax}
                  suppressEntryAnimation
                />
              </div>

              <div
                className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5"
                data-testid="log-evolution-legend"
                aria-label={t('history.evolution.legendAria')}
              >
                <span className="inline-flex items-center gap-2 font-mono text-[10px] text-zinc-300">
                  <span
                    className="inline-block h-0 w-7 border-t-2 border-dashed border-amber-400"
                    aria-hidden
                  />
                  {t('history.evolution.legendBaseline', { date: baselineDate })}
                </span>
                <span className="inline-flex items-center gap-2 font-mono text-[10px] text-zinc-300">
                  <span
                    className="inline-block h-0 w-7 border-t-[2.5px] border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.55)]"
                    aria-hidden
                  />
                  {t('history.evolution.legendCurrent', { date: currentDate })}
                </span>
              </div>

              {report.mode === 'baseline_ready' ? (
                <p
                  className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-amber-300/90"
                  data-testid="log-evolution-baseline-locked"
                >
                  {t('history.evolution.baselineLocked')}
                </p>
              ) : (
                <div className="mt-3 space-y-2" data-testid="log-evolution-deltas">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800/90 bg-zinc-900/50 px-3 py-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      {t('history.evolution.overallLabel')}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-sm tabular-nums text-zinc-100">
                      <span>
                        {formatAxisScoreReadout(report.baseline?.overallScore, empty)}
                        <span className="mx-1.5 text-zinc-500">→</span>
                        {formatAxisScoreReadout(report.current.overallScore, empty)}
                      </span>
                      {report.overallDelta != null ? (
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold ${
                            report.overallDelta >= 0
                              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                              : 'border-amber-500/40 bg-amber-950/40 text-amber-200'
                          }`}
                        >
                          {formatSignedDelta(report.overallDelta, empty)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {report.deltas.map((row) => (
                      <li
                        key={row.axis}
                        className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/35 px-2.5 py-1.5"
                        data-testid={`log-evolution-delta-${row.axis}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[9px] uppercase tracking-wide text-zinc-500">
                            {t(`history.card.axis.${row.axis}`)}
                            {row.isPersonalBest ? (
                              <span className="ml-1.5 text-amber-300">
                                {t('history.evolution.prBadge')}
                              </span>
                            ) : null}
                          </p>
                          <p className="font-mono text-xs tabular-nums text-zinc-200">
                            {formatAxisScoreReadout(row.from, empty)}
                            <span className="mx-1 text-zinc-500">→</span>
                            {formatAxisScoreReadout(row.to, empty)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${
                            row.delta >= 0
                              ? 'border-emerald-500/35 bg-emerald-950/35 text-emerald-300'
                              : 'border-amber-500/35 bg-amber-950/35 text-amber-200'
                          }`}
                        >
                          {formatSignedDelta(row.delta, empty)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                {t('history.evolution.vsBaseline')}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default LogEvolutionCard;
