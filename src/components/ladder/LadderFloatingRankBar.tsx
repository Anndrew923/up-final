import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeaderboardShardId } from '../../logic/core/ladderShards';

export interface LadderFloatingRankBarProps {
  shardId: LeaderboardShardId;
  myRank: number;
  myScore: number;
  onJumpToMyRow: () => void;
  formatScore: (shardId: LeaderboardShardId, scoreBest: number) => string;
}

const LadderFloatingRankBar: FC<LadderFloatingRankBarProps> = ({
  shardId,
  myRank,
  myScore,
  onJumpToMyRow,
  formatScore,
}) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onJumpToMyRow}
      className="fixed inset-x-0 z-30 mx-auto w-full max-w-3xl px-3"
      style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label={t('ladder.floatingRank.cta', { ns: 'common' })}
      title={t('ladder.floatingRank.cta', { ns: 'common' })}
    >
      <div className="ui-card flex w-full items-center justify-between gap-3 border-accent-primary/30 bg-bg-card/95 px-3 py-2 text-left shadow-panel backdrop-blur-md transition hover:border-accent-primary/45">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-primary">
            {t('ladder.floatingRank.kicker', { ns: 'common' })}
          </p>
          <p className="truncate text-xs text-zinc-300">
            {t('ladder.floatingRank.globalRank', { ns: 'common', rank: myRank })}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-semibold text-accent-primary">
            {formatScore(shardId, myScore)}
          </p>
          <p className="text-[10px] text-zinc-500">
            {t('ladder.floatingRank.cta', { ns: 'common' })}
          </p>
        </div>
      </div>
    </button>
  );
};

export default LadderFloatingRankBar;
