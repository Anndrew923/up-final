import { useId, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { formatHistoryCardSavedAt } from '../../i18n/formatHistorySavedAt';
import { formatAxisScoreReadout } from '../../logic/core/formatAxisScoreReadout';
import { buildHistoryRawTelemetryViewModel } from '../../logic/core/historyRawTelemetryViewModel';
import type { LocalHistoryRecord } from '../../logic/core/localHistoryRecord';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import { CollapsibleChevron } from '../CollapsibleChevron';
import HistoryRecordRawTelemetry from './HistoryRecordRawTelemetry';

export interface HistoryLogCardProps {
  record: LocalHistoryRecord;
  valueEmptyLabel: string;
  onDelete: (id: string) => void;
}

/** Mobile-native dyno log card — six-axis bento + expandable raw telemetry report. */
const HistoryLogCard: FC<HistoryLogCardProps> = ({ record, valueEmptyLabel, onDelete }) => {
  const { t } = useTranslation('common');
  const panelId = useId();
  const telemetry = buildHistoryRawTelemetryViewModel(record.rawInputs);
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      data-testid="history-log-card"
    >
      <header className="flex items-start justify-between gap-2 border-b border-zinc-800/80 px-3.5 py-3">
        {/* shrink-0: date must never be crushed into ellipsis by the overall/score cluster. */}
        <div className="shrink-0">
          <time
            dateTime={record.createdAt}
            className="block whitespace-nowrap font-mono text-[11px] tabular-nums text-zinc-400"
            data-testid="history-card-saved-at"
          >
            {formatHistoryCardSavedAt(record.createdAt)}
          </time>
          <button
            type="button"
            onClick={() => onDelete(record.id)}
            className="mt-1.5 text-[10px] font-medium text-zinc-500 transition hover:text-red-300"
          >
            {t('history.delete')}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
              {t('history.colOverall')}
            </p>
            <p
              className="font-mono text-2xl font-semibold tabular-nums leading-none text-accent-info"
              data-testid="history-card-overall"
            >
              {formatAxisScoreReadout(record.overallScore, valueEmptyLabel)}
            </p>
          </div>
          {telemetry.hasRawArchive ? (
            <span
              className="rounded border border-cyan-500/35 bg-cyan-950/40 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-200/90"
              data-testid="history-raw-badge"
            >
              {t('history.rawTelemetry.badge')}
            </span>
          ) : null}
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700/80 text-zinc-300 transition hover:border-accent-primary/50 hover:text-zinc-100"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((v) => !v)}
            title={
              expanded ? t('history.rawTelemetry.collapse') : t('history.rawTelemetry.expand')
            }
          >
            <CollapsibleChevron
              expanded={expanded}
              className="h-4 w-4 shrink-0 text-accent-primary/90"
            />
            <span className="sr-only">
              {expanded ? t('history.rawTelemetry.collapse') : t('history.rawTelemetry.expand')}
            </span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 px-3.5 py-3" data-testid="history-card-axis-grid">
        {SIX_AXIS_METRICS.map((metric) => (
          <div
            key={metric}
            className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-2 py-1.5 text-center"
          >
            <p className="whitespace-nowrap font-mono text-[9px] uppercase tracking-wide text-zinc-500">
              {t(`history.card.axis.${metric}`)}
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-zinc-100">
              {formatAxisScoreReadout(record.scores[metric], valueEmptyLabel)}
            </p>
          </div>
        ))}
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
          <div
            id={panelId}
            role="region"
            aria-hidden={!expanded}
            className="border-t border-zinc-800/80 px-3.5 py-3"
            data-testid="history-card-raw-panel"
          >
            {/* Mount telemetry only while open — avoids 200× hidden report trees on long logs. */}
            {expanded ? <HistoryRecordRawTelemetry viewModel={telemetry} /> : null}
          </div>
        </div>
      </div>
    </article>
  );
};

export default HistoryLogCard;
