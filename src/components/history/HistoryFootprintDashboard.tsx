import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleChevron } from '../CollapsibleChevron';
import type { TrainingFootprintPanelView } from '../../logic/core/trainingFootprintBadges';
import type { FootprintLevel } from '../../logic/core/trainingFootprint';
import HistorySpecBadgeRack from './HistorySpecBadgeRack';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const TOGGLE_ID = 'history-rhythm-toggle';
const PANEL_ID = 'history-rhythm-panel';

const PILL_CLASS =
  'whitespace-nowrap rounded-full border border-zinc-700/50 bg-zinc-800/80 px-2.5 py-0.5 font-mono text-[11px] tabular-nums text-zinc-300 sm:text-xs';

/** Match History page kicker: small mono track, never heavier than the title. */
const KICKER_CLASS =
  'block font-mono text-[10px] uppercase tracking-[0.25em] text-accent-primary/90';

const TITLE_CLASS =
  'mt-0.5 block whitespace-nowrap text-base font-semibold tracking-tight text-zinc-100 sm:text-lg';

const HEADER_TOP_ROW_CLASS =
  'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3';

const HEADER_PILLS_ROW_CLASS = 'flex w-full flex-wrap items-center gap-2 pt-0.5';

/** Design intent: two-tier control so title stays fully visible; pills never compete on the title row. */
const HEADER_TOGGLE_CLASS =
  'flex w-full flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-left transition-[background-color,border-color,transform] duration-150 hover:border-zinc-700 hover:bg-zinc-900/80 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-info/60 sm:p-3.5';

const CHEVRON_BADGE_CLASS =
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10';

const CHEVRON_ICON_CLASS = 'h-3.5 w-3.5 shrink-0 text-amber-500';

const LEVEL_DOT_CLASS: Record<FootprintLevel | 0, string> = {
  0: 'bg-zinc-800',
  1: 'bg-zinc-500',
  2: 'bg-cyan-400/85',
  3: 'bg-amber-400',
};

function levelLabelKey(level: FootprintLevel | 0): string {
  if (level === 1) return 'history.footprint.levelTool';
  if (level === 2) return 'history.footprint.levelArchive';
  if (level === 3) return 'history.footprint.levelPr';
  return 'history.footprint.levelEmpty';
}

export type HistoryFootprintDashboardProps = TrainingFootprintPanelView & {
  expanded: boolean;
  onToggle: () => void;
  unseenBadgeIds: ReadonlySet<string>;
};

const HistoryFootprintDashboard: FC<HistoryFootprintDashboardProps> = ({
  weeklyCount,
  weeklyTarget,
  lifetimeDays,
  monthCells,
  badges,
  expanded,
  onToggle,
  unseenBadgeIds,
}) => {
  const { t } = useTranslation('common');
  const title = t('history.footprint.title');
  const actionLabel = expanded
    ? t('history.footprint.toggleCollapse')
    : t('history.footprint.toggleExpand');

  return (
    <div>
      <button
        type="button"
        id={TOGGLE_ID}
        className={HEADER_TOGGLE_CLASS}
        aria-expanded={expanded}
        aria-controls={PANEL_ID}
        onClick={onToggle}
      >
        <span className={HEADER_TOP_ROW_CLASS}>
          <span className="min-w-0">
            <span className={KICKER_CLASS}>{t('history.footprint.kicker')}</span>
            <span className={TITLE_CLASS}>{title}</span>
            <span className="sr-only">{actionLabel}</span>
          </span>
          <span className={CHEVRON_BADGE_CLASS}>
            <CollapsibleChevron expanded={expanded} className={CHEVRON_ICON_CLASS} />
          </span>
        </span>
        {!expanded ? (
          <span className={HEADER_PILLS_ROW_CLASS}>
            <span className={PILL_CLASS}>
              {t('history.footprint.collapsedWeekly', {
                count: weeklyCount,
                target: weeklyTarget,
              })}
            </span>
            <span className={PILL_CLASS}>
              {t('history.footprint.collapsedLifetime', { count: lifetimeDays })}
            </span>
          </span>
        ) : null}
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div
          className={`min-h-0 overflow-hidden ${expanded ? '' : 'pointer-events-none'}`}
          inert={expanded ? undefined : true}
        >
          <div
            id={PANEL_ID}
            role="region"
            aria-labelledby={TOGGLE_ID}
            aria-hidden={!expanded}
          >
            <div className="mt-4 grid grid-cols-2 gap-3">
              <p className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {t('history.footprint.weeklyLabel')}
                </span>
                <span className="mt-1 block font-mono text-sm tabular-nums text-zinc-100">
                  {t('history.footprint.weeklyValue', { count: weeklyCount, target: weeklyTarget })}
                </span>
              </p>
              <p className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {t('history.footprint.lifetimeLabel')}
                </span>
                <span className="mt-1 block font-mono text-sm tabular-nums text-zinc-100">
                  {t('history.footprint.lifetimeValue', { count: lifetimeDays })}
                </span>
              </p>
            </div>

            <p className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {t('history.footprint.monthLabel')}
            </p>
            <div
              className="grid grid-cols-7 gap-1.5"
              role="grid"
              aria-label={t('history.footprint.monthAria')}
            >
              {WEEKDAY_KEYS.map((day) => (
                <span
                  key={day}
                  className="text-center font-mono text-[9px] uppercase tracking-wide text-zinc-600"
                >
                  {t(`history.footprint.weekdays.${day}`)}
                </span>
              ))}
              {monthCells.map((cell, index) => {
                if (cell.dateKey == null || cell.dayOfMonth == null) {
                  return <span key={`pad-${index}`} className="aspect-square" aria-hidden />;
                }
                return (
                  <span
                    key={cell.dateKey}
                    role="gridcell"
                    title={t(levelLabelKey(cell.level), { date: cell.dateKey })}
                    aria-label={t(levelLabelKey(cell.level), { date: cell.dateKey })}
                    className={`aspect-square rounded-full ${LEVEL_DOT_CLASS[cell.level]}`}
                  />
                );
              })}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-zinc-500">
              <li className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-500" aria-hidden />
                {t('history.footprint.legendTool')}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400/85" aria-hidden />
                {t('history.footprint.legendArchive')}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                {t('history.footprint.legendPr')}
              </li>
            </ul>
            <HistorySpecBadgeRack badges={badges} inspectionEnabled={expanded} unseenBadgeIds={unseenBadgeIds} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryFootprintDashboard;
