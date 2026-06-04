import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeaderboardShardId } from '../../logic/core/ladderShards';

export interface LadderFloatingRankBarProps {
  shardId: LeaderboardShardId;
  myRank: number;
  myScore: number;
  avatarUrl?: string;
  displayName: string;
  isAnonymous?: boolean;
  onJumpToMyRow: () => void;
  formatScore: (shardId: LeaderboardShardId, scoreBest: number) => string;
}

function rankBadgeFor(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  if (rank <= 10) return '🏆';
  return '';
}

const LadderFloatingRankBar: FC<LadderFloatingRankBarProps> = ({
  shardId,
  myRank,
  myScore,
  avatarUrl,
  displayName,
  isAnonymous = false,
  onJumpToMyRow,
  formatScore,
}) => {
  const { t } = useTranslation();
  const badge = rankBadgeFor(myRank);
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || '?';

  return (
    <button
      type="button"
      onClick={onJumpToMyRow}
      className="pointer-events-auto fixed inset-x-0 z-30 mx-auto w-full max-w-3xl px-3"
      style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label={t('ladder.floatingRank.cta', { ns: 'common' })}
      title={t('ladder.floatingRank.cta', { ns: 'common' })}
    >
      <div className="ui-card flex w-full items-center gap-3 border border-cyan-400/40 bg-slate-900/95 px-3 py-2.5 text-left shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-md transition hover:border-cyan-400/55 active:scale-[0.99]">
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <span className="font-mono text-sm font-bold tabular-nums text-cyan-300">#{myRank}</span>
          {badge ? <span className="text-xs leading-none">{badge}</span> : null}
        </div>

        {avatarUrl && !isAnonymous ? (
          <img
            src={avatarUrl}
            alt=""
            aria-hidden
            className="h-10 w-10 shrink-0 rounded-full border border-cyan-400/35 object-cover shadow-[0_0_10px_rgba(34,211,238,0.2)]"
          />
        ) : (
          <div
            aria-hidden
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/35 bg-slate-800 text-sm font-semibold text-cyan-200 ${isAnonymous ? 'font-mono tracking-widest' : ''}`}
          >
            {isAnonymous ? '?' : avatarInitial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
            {t('ladder.floatingRank.kicker', { ns: 'common' })}
          </p>
          <p
            className={`truncate text-sm font-semibold text-zinc-100 ${isAnonymous ? 'italic opacity-80' : ''}`}
          >
            {displayName}
          </p>
          <p className="truncate text-[10px] text-zinc-500">
            {t('ladder.floatingRank.globalRank', { ns: 'common', rank: myRank })}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-base font-semibold tabular-nums text-cyan-300">
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
