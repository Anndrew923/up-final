import { type FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { splitDynoIntelCommentaryParagraphs } from '../../logic/core/dynoIntelCommentaryFormat';
import type { DynoIntelLogEntry } from '../../logic/core/dynoIntelLogTypes';
import DynoIntelClearHistoryDialog from './DynoIntelClearHistoryDialog';

export interface DynoIntelTelemetryLogAccordionProps {
  entries: DynoIntelLogEntry[];
  logCap: number;
  storageError: boolean;
  onClear: () => void;
}

function formatLogTimestamp(timestamp: number, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'zh-Hant' ? 'zh-TW' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

function resolveAxisLabel(focusAxis: string, t: (key: string) => string): string {
  if (focusAxis === 'cross-axis') {
    return t('dynoIntel.telemetryLog.crossAxis');
  }
  if (focusAxis === 'unknown') {
    return t('dynoIntel.telemetryLog.unknownAxis');
  }
  const key = `axisLexicon.output.full.${focusAxis}`;
  const resolved = t(key);
  return resolved === key ? focusAxis : resolved;
}

const DynoIntelTelemetryLogAccordion: FC<DynoIntelTelemetryLogAccordionProps> = ({
  entries,
  logCap,
  storageError,
  onClear,
}) => {
  const { t, i18n } = useTranslation('common');
  const [openId, setOpenId] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.timestamp - a.timestamp),
    [entries]
  );

  const historyEntries = sortedEntries.slice(1);

  if (sortedEntries.length === 0 && !storageError) {
    return null;
  }

  return (
    <>
      <section className="mt-6 border-t border-zinc-800/80 pt-4">
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-cyan-300/70">
              {t('dynoIntel.telemetryLog.title')}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {t('dynoIntel.telemetryLog.subtitle', {
                count: sortedEntries.length,
                cap: logCap,
              })}
            </p>
          </div>
          {sortedEntries.length > 0 ? (
            <button
              type="button"
              className="shrink-0 rounded-lg border border-red-400/25 bg-red-950/25 px-2.5 py-1.5 font-mono text-[10px] text-red-200 transition-colors hover:border-red-400/45 hover:bg-red-950/45"
              onClick={() => setClearDialogOpen(true)}
            >
              {t('dynoIntel.telemetryLog.clearAction')}
            </button>
          ) : null}
        </header>

        {storageError ? (
          <p className="mb-3 rounded-lg border border-red-400/25 bg-red-950/25 px-3 py-2 text-xs leading-relaxed text-red-200">
            {t('dynoIntel.telemetryLog.storageError')}
          </p>
        ) : null}

        <ul className="space-y-2">
          {historyEntries.map((entry) => {
            const expanded = openId === entry.id;
            const paragraphs = splitDynoIntelCommentaryParagraphs(entry.commentary);
            const axisLabel = resolveAxisLabel(entry.focusAxis, t);

            return (
              <li
                key={entry.id}
                className="overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-900/40"
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left"
                  aria-expanded={expanded}
                  onClick={() => setOpenId(expanded ? null : entry.id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] text-zinc-500">
                      {t('dynoIntel.telemetryLog.entryTime', {
                        date: formatLogTimestamp(entry.timestamp, i18n.language),
                      })}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-300">{entry.userQuestion}</p>
                    <p className="mt-0.5 text-[10px] text-cyan-300/70">
                      {t('dynoIntel.telemetryLog.entryAxis', { axis: axisLabel })}
                    </p>
                  </div>
                  <span className="shrink-0 pt-0.5 font-mono text-[10px] text-zinc-500">
                    {expanded
                      ? t('dynoIntel.telemetryLog.collapse')
                      : t('dynoIntel.telemetryLog.expand')}
                  </span>
                </button>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-out',
                    expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-2 border-t border-zinc-800/80 px-3 py-3 text-xs leading-6 text-zinc-300">
                      {paragraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <DynoIntelClearHistoryDialog
        open={clearDialogOpen}
        onCancel={() => setClearDialogOpen(false)}
        onConfirm={() => {
          onClear();
          setClearDialogOpen(false);
          setOpenId(null);
        }}
      />
    </>
  );
};

export default DynoIntelTelemetryLogAccordion;
