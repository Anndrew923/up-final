import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  LadderSyncShardFailure,
  LeaderboardSyncRunSummary,
} from '../../logic/core/leaderboardSyncTargets';

export interface LadderSyncSummaryStatusProps {
  summary: LeaderboardSyncRunSummary;
  failures?: LadderSyncShardFailure[];
  className?: string;
}

/**
 * Presents batch sync tallies plus per-shard failure rows.
 * WHY: Generic "errors: 16" hid invalid-input vs internal — this surfaces both layers.
 */
const LadderSyncSummaryStatus: FC<LadderSyncSummaryStatusProps> = ({
  summary,
  failures = [],
  className,
}) => {
  const { t } = useTranslation('common');

  const tone =
    summary.updated > 0
      ? 'text-emerald-400/90'
      : summary.unchanged === summary.attempted
        ? 'text-zinc-300'
        : 'text-zinc-400';

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <p className={`text-sm ${tone}`} role="status">
        {t('ladder.syncAll.summary', {
          attempted: summary.attempted,
          updated: summary.updated,
          unchanged: summary.unchanged,
          rateLimited: summary.rateLimited,
          proRequired: summary.proRequired,
          invalidInput: summary.invalidInput,
          internal: summary.internal,
          errors: summary.errors,
        })}
      </p>

      {failures.length > 0 ? (
        <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/60 p-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {t('ladder.syncAll.failuresTitle', { count: failures.length })}
          </p>
          <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto text-xs text-zinc-400">
            {failures.map((row) => (
              <li key={`${row.metric}-${row.reason}-${row.message ?? ''}`}>
                <span className="font-mono text-zinc-300">
                  {t(`ladder.syncAll.failureMetric.${row.metric}`, {
                    defaultValue: row.metric,
                  })}
                </span>
                {' · '}
                <span>{t(`ladder.syncAll.failureReason.${row.reason}`, { defaultValue: row.reason })}</span>
                {row.message ? (
                  <span className="block truncate text-zinc-500" title={row.message}>
                    {row.message}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default LadderSyncSummaryStatus;
