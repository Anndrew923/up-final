import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useLeaderboardSyncAll } from '../../hooks/useLeaderboardSyncAll';

export interface LeaderboardSyncAllBarProps {
  /** Called after a full pass completes (e.g. bump ladder fetch nonce). */
  onFinished?: () => void;
  className?: string;
}

/**
 * One-shot upload of every shard derived from the merged radar score map + overall.
 */
const LeaderboardSyncAllBar: FC<LeaderboardSyncAllBarProps> = ({ onFinished, className }) => {
  const { t } = useTranslation('common');
  const { syncAll, busy, summary, gate, targetCount, goJoinArena, clearFeedback } = useLeaderboardSyncAll({
    onFinished,
  });

  const disabled = gate !== 'ok' || busy || targetCount === 0;

  return (
    <div className={`space-y-2 border-t border-zinc-800/80 pt-4 ${className ?? ''}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {t('ladder.syncAll.sectionTitle')}
      </p>
      <p className="text-xs leading-relaxed text-zinc-500">{t('ladder.syncAll.hint')}</p>

      {targetCount === 0 ? (
        <p className="text-xs leading-relaxed text-zinc-500">{t('ladder.syncAll.noTargets')}</p>
      ) : gate !== 'ok' ? (
        <p className="text-xs leading-relaxed text-zinc-500">{t(`ladder.upload.gate.${gate}`)}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="ui-btn border-accent-info/35 text-accent-info"
          disabled={disabled}
          onClick={() => {
            clearFeedback();
            void syncAll();
          }}
        >
          {busy ? t('ladder.syncAll.busy') : t('ladder.syncAll.button')}
        </button>
        {gate === 'no-pro' ? (
          <button type="button" className="ui-btn text-xs" onClick={goJoinArena}>
            {t('ladder.upload.joinArena')}
          </button>
        ) : null}
      </div>

      {summary && summary.attempted > 0 ? (
        <p className="text-sm text-zinc-400" role="status">
          {t('ladder.syncAll.summary', {
            attempted: summary.attempted,
            updated: summary.updated,
            errors: summary.errors,
            rateLimited: summary.rateLimited,
            proRequired: summary.proRequired,
          })}
        </p>
      ) : null}
    </div>
  );
};

export default LeaderboardSyncAllBar;
