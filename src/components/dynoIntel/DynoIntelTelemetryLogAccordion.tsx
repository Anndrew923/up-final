import { type FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { splitDynoIntelCommentaryParagraphs } from '../../logic/core/dynoIntelCommentaryFormat';
import type { DynoIntelLogEntry } from '../../logic/core/dynoIntelLogTypes';

export interface DynoIntelTelemetryLogAccordionProps {
  entries: DynoIntelLogEntry[];
  /** Core cap for subtitle; null when Pro (unlimited). */
  logCap: number | null;
  isPro: boolean;
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

function resolveAxisLabel(
  focusAxis: string,
  t: (key: string) => string
): string {
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
  isPro,
}) => {
  const { t, i18n } = useTranslation('common');
  const [openId, setOpenId] = useState<string | null>(null);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.timestamp - a.timestamp),
    [entries]
  );

  const historyEntries = sortedEntries.slice(1);

  if (sortedEntries.length <= 1) {
    return null;
  }

  const subtitleKey = isPro ? 'dynoIntel.telemetryLog.subtitlePro' : 'dynoIntel.telemetryLog.subtitleCore';

  return (
    <section className="mt-6 border-t border-zinc-800/80 pt-4">
      <header className="mb-3">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-cyan-300/70">
          {t('dynoIntel.telemetryLog.title')}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          {t(subtitleKey, {
            count: sortedEntries.length,
            cap: logCap ?? sortedEntries.length,
          })}
        </p>
      </header>

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
  );
};

export default DynoIntelTelemetryLogAccordion;
