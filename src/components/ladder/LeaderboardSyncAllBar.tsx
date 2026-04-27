import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLeaderboardSyncAll } from '../../hooks/useLeaderboardSyncAll';
import LadderInfoSheet from './LadderInfoSheet';

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
  const [infoOpen, setInfoOpen] = useState(false);
  const { syncAll, busy, gate, targetCount, goJoinArena, clearFeedback } = useLeaderboardSyncAll({
    onFinished,
  });

  const disabled = gate !== 'ok' || busy || targetCount === 0;

  return (
    <div className={`space-y-2 border-t border-zinc-800/80 pt-2 ${className ?? ''}`}>
      <p className="text-xs leading-relaxed text-zinc-500">{t('ladder.syncAll.hint')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/60 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
          aria-label={t('ladder.syncAll.infoButtonAria')}
          onClick={() => setInfoOpen(true)}
        >
          ⓘ
        </button>
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
      <LadderInfoSheet
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title={t('ladder.syncAll.advancedTitle')}
        body={t('ladder.syncAll.advancedTip')}
      />
    </div>
  );
};

export default LeaderboardSyncAllBar;
