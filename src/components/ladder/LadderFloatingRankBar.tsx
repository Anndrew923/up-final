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
  isFilterActive: boolean;
  myFilteredRank: number | null;
  isMeInFilteredList: boolean;
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
  isFilterActive,
  myFilteredRank,
  isMeInFilteredList,
  onJumpToMyRow,
  formatScore,
}) => {
  const { t } = useTranslation();
  const isExcludedByFilters = isFilterActive && !isMeInFilteredList;
  const showFilteredSubline =
    isFilterActive && isMeInFilteredList && myFilteredRank !== null && !isExcludedByFilters;
  const displayRank =
    showFilteredSubline && myFilteredRank !== null ? myFilteredRank : myRank;
  const badge = isExcludedByFilters ? '' : rankBadgeFor(displayRank);
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || '?';

  const shellClass =
    'pointer-events-auto fixed inset-x-0 z-30 mx-auto w-full max-w-3xl px-3';
  const shellStyle = { bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' };

  const cardInner = (
    <div
      className={`ui-card flex w-full items-center gap-3 border px-3 py-2 text-left backdrop-blur-md ${
        isExcludedByFilters
          ? 'border-zinc-600/50 bg-slate-900/90 shadow-none'
          : 'border-cyan-400/40 bg-slate-900/95 shadow-[0_0_24px_rgba(34,211,238,0.18)] transition hover:border-cyan-400/55 active:scale-[0.99]'
      }`}
    >
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        {isExcludedByFilters ? (
          <span className="font-mono text-sm font-bold text-zinc-500">—</span>
        ) : (
          <>
            <span className="font-mono text-sm font-bold tabular-nums text-cyan-300">
              #{displayRank}
            </span>
            {badge ? <span className="text-xs leading-none">{badge}</span> : null}
          </>
        )}
      </div>

      {avatarUrl && !isAnonymous ? (
        <img
          src={avatarUrl}
          alt=""
          aria-hidden
          className={`h-10 w-10 shrink-0 rounded-full border object-cover ${
            isExcludedByFilters
              ? 'border-zinc-600/40 opacity-70'
              : 'border-cyan-400/35 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
          }`}
        />
      ) : (
        <div
          aria-hidden
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
            isExcludedByFilters
              ? 'border-zinc-600/40 bg-slate-800 text-zinc-500'
              : `border-cyan-400/35 bg-slate-800 text-cyan-200 ${isAnonymous ? 'font-mono tracking-widest' : ''}`
          }`}
        >
          {isAnonymous ? '?' : avatarInitial}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold leading-tight ${
            isExcludedByFilters
              ? 'text-zinc-400'
              : `text-zinc-100 ${isAnonymous ? 'italic opacity-80' : ''}`
          }`}
        >
          {displayName}
        </p>
        {showFilteredSubline && myFilteredRank !== null ? (
          <p className="truncate text-[10px] text-cyan-400/75">
            {t('ladder.floatingRank.filteredRankShort', { ns: 'common', rank: myFilteredRank })}
          </p>
        ) : null}
        {isExcludedByFilters ? (
          <p className="truncate text-[10px] italic text-zinc-500">
            {t('ladder.floatingRank.notRankedUnderFilters', { ns: 'common' })}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`font-mono text-base font-semibold tabular-nums leading-tight ${
            isExcludedByFilters ? 'text-zinc-400' : 'text-cyan-300'
          }`}
        >
          {formatScore(shardId, myScore)}
        </p>
      </div>
    </div>
  );

  if (isExcludedByFilters) {
    return (
      <div
        className={shellClass}
        style={shellStyle}
        aria-live="polite"
        aria-label={t('ladder.floatingRank.notRankedUnderFilters', { ns: 'common' })}
      >
        {cardInner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onJumpToMyRow}
      className={shellClass}
      style={shellStyle}
      aria-label={t('ladder.floatingRank.cta', { ns: 'common' })}
      title={t('ladder.floatingRank.cta', { ns: 'common' })}
    >
      {cardInner}
    </button>
  );
};

export default LadderFloatingRankBar;
