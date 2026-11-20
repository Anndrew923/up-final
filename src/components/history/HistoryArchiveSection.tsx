/**
 * DYNO ARCHIVE collapsible shell around HistoryLogCard list.
 *
 * WHY: Third LOGS section must share HistoryFootprintDashboard chevron / pill
 * vocabulary without changing individual log card behavior.
 */
import { useId, useState, type FC, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatAxisScoreReadout } from '../../logic/core/formatAxisScoreReadout';
import type { HistoryArchiveSummary } from '../../logic/core/historyArchiveSummary';
import { CollapsibleChevron } from '../CollapsibleChevron';
import {
  HISTORY_COLLAPSIBLE_CHROME as chrome,
  HISTORY_SECTION_DEFAULT_EXPANDED,
} from './historyCollapsibleChrome';

export interface HistoryArchiveSectionProps {
  summary: HistoryArchiveSummary;
  children: ReactNode;
}

const HistoryArchiveSection: FC<HistoryArchiveSectionProps> = ({ summary, children }) => {
  const { t } = useTranslation('common');
  const toggleId = useId();
  const panelId = useId();
  // WHY: First-screen density — archive opens as count/best pills; expand to browse logs.
  const [expanded, setExpanded] = useState(HISTORY_SECTION_DEFAULT_EXPANDED);
  const empty = t('history.valueEmpty');
  const actionLabel = expanded
    ? t('history.archive.toggleCollapse')
    : t('history.archive.toggleExpand');

  return (
    <section data-testid="history-archive-section">
      <button
        type="button"
        id={toggleId}
        className={chrome.headerToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        data-testid="history-archive-toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={chrome.headerTopRow}>
          <span className="min-w-0">
            <span className={chrome.kicker}>{t('history.archive.kicker')}</span>
            <span className={chrome.title}>{t('history.archive.title')}</span>
            <span className="sr-only">{actionLabel}</span>
          </span>
          <span className={chrome.chevronBadge}>
            <CollapsibleChevron expanded={expanded} className={chrome.chevronIcon} />
          </span>
        </span>
        {!expanded ? (
          <span className={chrome.headerPillsRow} data-testid="history-archive-collapsed-pills">
            <span className={chrome.pill}>
              {t('history.archive.collapsedCount', { count: summary.count })}
            </span>
            <span className={chrome.pill}>
              {t('history.archive.collapsedBest', {
                bestScore: formatAxisScoreReadout(summary.bestOverall ?? undefined, empty),
              })}
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
          {/* Mount log cards only while open — avoids 200× card trees on the collapsed first paint. */}
          {expanded ? (
            <div
              id={panelId}
              role="region"
              aria-labelledby={toggleId}
              aria-hidden={false}
              className="mt-3 space-y-3"
              data-testid="history-log-card-list"
            >
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default HistoryArchiveSection;
