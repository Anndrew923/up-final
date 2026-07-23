import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BOTTOM_CHROME_STACK_PX, bottomChromeCalc } from '../../constants/bottomChrome';
import { cn } from '../../lib/cn';
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

const pillBase =
  'flex items-center border backdrop-blur-md motion-safe:transition-[border-color,transform] motion-safe:duration-150';

/**
 * Dual-pill floating rank — center notch clears the raised BottomNav DYNO hex.
 * WHY: A full-bleed bar shares the same vertical band as the hex + Dyno Intel chip
 * and gets clipped; left identity / right score stay readable on both ends.
 *
 * Interaction: only the left pill is a keyboard/SR focus target. The right score
 * pill mirrors the same jump action for touch but is aria-hidden so we do not
 * expose two identical CTAs. Center spacer keeps pointer-events none so DYNO
 * hex taps pass through.
 */
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
  const jumpLabel = t('ladder.floatingRank.cta', { ns: 'common' });
  const excludedLabel = t('ladder.floatingRank.notRankedUnderFilters', { ns: 'common' });

  const pillTone = isExcludedByFilters
    ? 'border-zinc-600/50 bg-slate-900/90 shadow-none'
    : 'border-cyan-400/40 bg-slate-900/95 shadow-[0_0_20px_rgba(34,211,238,0.16)] hover:border-cyan-400/55 active:scale-[0.99]';

  const leftPillInner = (
    <>
      <span className="flex shrink-0 flex-col items-center gap-0.5">
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
      </span>

      {avatarUrl && !isAnonymous ? (
        <img
          src={avatarUrl}
          alt=""
          aria-hidden
          className={cn(
            'h-9 w-9 shrink-0 rounded-full border object-cover',
            isExcludedByFilters
              ? 'border-zinc-600/40 opacity-70'
              : 'border-cyan-400/35 shadow-[0_0_10px_rgba(34,211,238,0.2)]',
          )}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
            isExcludedByFilters
              ? 'border-zinc-600/40 bg-slate-800 text-zinc-500'
              : 'border-cyan-400/35 bg-slate-800 text-cyan-200',
            !isExcludedByFilters && isAnonymous && 'font-mono tracking-widest',
          )}
        >
          {isAnonymous ? '?' : avatarInitial}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-sm font-semibold leading-tight',
            isExcludedByFilters ? 'text-zinc-400' : 'text-zinc-100',
            !isExcludedByFilters && isAnonymous && 'italic opacity-80',
          )}
        >
          {displayName}
        </span>
        {showFilteredSubline && myFilteredRank !== null ? (
          <span className="block truncate text-[10px] text-cyan-400/75">
            {t('ladder.floatingRank.filteredRankShort', { ns: 'common', rank: myFilteredRank })}
          </span>
        ) : null}
        {isExcludedByFilters ? (
          <span className="block truncate text-[10px] italic text-zinc-500">{excludedLabel}</span>
        ) : null}
      </span>
    </>
  );

  const rightPillInner = (
    <span
      className={cn(
        'font-mono text-base font-semibold tabular-nums leading-tight',
        isExcludedByFilters ? 'text-zinc-400' : 'text-cyan-300',
      )}
    >
      {formatScore(shardId, myScore)}
    </span>
  );

  const leftPillClass = cn(
    pillBase,
    'min-w-0 max-w-[min(42%,11.5rem)] gap-2 rounded-2xl px-2.5 py-2',
    pillTone,
  );
  const rightPillClass = cn(pillBase, 'shrink-0 rounded-2xl px-3 py-2', pillTone);

  const centerNotch = (
    <div className="pointer-events-none h-16 w-16 shrink-0 sm:w-20" aria-hidden />
  );

  const wrapPill = (opts: {
    side: 'left' | 'right';
    className: string;
    children: ReactNode;
  }) => {
    const { side, className, children } = opts;
    if (isExcludedByFilters) {
      return <div className={cn('pointer-events-auto min-w-0', className)}>{children}</div>;
    }
    if (side === 'left') {
      return (
        <button
          type="button"
          onClick={onJumpToMyRow}
          className={cn('pointer-events-auto min-w-0 text-left', className)}
          aria-label={jumpLabel}
          title={jumpLabel}
        >
          {children}
        </button>
      );
    }
    // Touch affordance only — keep a single keyboard/SR focus target on the left pill.
    return (
      <button
        type="button"
        onClick={onJumpToMyRow}
        tabIndex={-1}
        aria-hidden
        className={cn('pointer-events-auto min-w-0 text-right', className)}
        title={jumpLabel}
      >
        {children}
      </button>
    );
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex w-full max-w-3xl items-end justify-between gap-2 px-3"
      style={{ bottom: bottomChromeCalc(BOTTOM_CHROME_STACK_PX) }}
      aria-live={isExcludedByFilters ? 'polite' : undefined}
      aria-label={isExcludedByFilters ? excludedLabel : undefined}
    >
      {wrapPill({ side: 'left', className: leftPillClass, children: leftPillInner })}
      {centerNotch}
      {wrapPill({ side: 'right', className: rightPillClass, children: rightPillInner })}
    </div>
  );
};

export default LadderFloatingRankBar;
