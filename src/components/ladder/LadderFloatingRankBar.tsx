import { useId, type CSSProperties, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LADDER_BRIDGE_ARCH_DEPTH_PX,
  LADDER_BRIDGE_ARCH_WIDTH_PX,
  LADDER_BRIDGE_BOTTOM_PX,
  LADDER_BRIDGE_REF_WIDTH_PX,
  LADDER_FLOATING_RANK_BAR_PX,
  bottomChromeCalc,
} from '../../constants/bottomChrome';
import { cn } from '../../lib/cn';
import { buildLadderBridgeClipPathD } from '../../logic/core/ladderBridgeClipPath';
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

const BRIDGE_CLIP_PATH_D = buildLadderBridgeClipPathD({
  archWidthFrac: LADDER_BRIDGE_ARCH_WIDTH_PX / LADDER_BRIDGE_REF_WIDTH_PX,
  archDepthFrac: LADDER_BRIDGE_ARCH_DEPTH_PX / LADDER_FLOATING_RANK_BAR_PX,
});

/**
 * Single bridge floating rank — continuous shell with a center arch over the DYNO hex.
 * WHY: clip-path punches paint + hit-testing so the hex stays tappable; one button
 * avoids dual-CTA a11y debt from the earlier split-pill layout.
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
  const clipPathId = `ladder-bridge-clip-${useId().replace(/:/g, '')}`;

  const isExcludedByFilters = isFilterActive && !isMeInFilteredList;
  const showFilteredSubline =
    isFilterActive && isMeInFilteredList && myFilteredRank !== null && !isExcludedByFilters;
  const displayRank =
    showFilteredSubline && myFilteredRank !== null ? myFilteredRank : myRank;
  const badge = isExcludedByFilters ? '' : rankBadgeFor(displayRank);
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || '?';
  const jumpLabel = t('ladder.floatingRank.cta', { ns: 'common' });
  const excludedLabel = t('ladder.floatingRank.notRankedUnderFilters', { ns: 'common' });

  const shellStyle = {
    bottom: bottomChromeCalc(LADDER_BRIDGE_BOTTOM_PX),
    clipPath: `url(#${clipPathId})`,
    WebkitClipPath: `url(#${clipPathId})`,
  } satisfies CSSProperties;

  const shellClass = cn(
    'pointer-events-auto fixed inset-x-0 z-30 mx-auto flex w-full max-w-3xl items-center justify-between gap-3',
    'border px-3 py-2.5 text-left backdrop-blur-md',
    'motion-safe:transition-[border-color,transform] motion-safe:duration-150',
    isExcludedByFilters
      ? 'border-zinc-600/50 bg-slate-900/90 shadow-none'
      : 'border-cyan-400/40 bg-slate-900/95 shadow-[0_0_24px_rgba(34,211,238,0.18)] hover:border-cyan-400/55 active:scale-[0.99]',
  );

  const body = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
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
      </span>

      {/* Horizontal reserve matching arch width so identity/score never sit over the hex. */}
      <span
        className="pointer-events-none shrink-0"
        style={{ width: LADDER_BRIDGE_ARCH_WIDTH_PX, height: LADDER_BRIDGE_ARCH_DEPTH_PX }}
        aria-hidden
      />

      <span
        className={cn(
          'shrink-0 font-mono text-base font-semibold tabular-nums leading-tight',
          isExcludedByFilters ? 'text-zinc-400' : 'text-cyan-300',
        )}
      >
        {formatScore(shardId, myScore)}
      </span>
    </>
  );

  return (
    <>
      {/* Defs live outside the interactive shell — keeps <button> free of SVG flow children. */}
      <svg width={0} height={0} className="absolute" aria-hidden focusable="false">
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            <path d={BRIDGE_CLIP_PATH_D} />
          </clipPath>
        </defs>
      </svg>

      {isExcludedByFilters ? (
        <div
          className={shellClass}
          style={shellStyle}
          aria-live="polite"
          aria-label={excludedLabel}
        >
          {body}
        </div>
      ) : (
        <button
          type="button"
          onClick={onJumpToMyRow}
          className={shellClass}
          style={shellStyle}
          aria-label={jumpLabel}
          title={jumpLabel}
        >
          {body}
        </button>
      )}
    </>
  );
};

export default LadderFloatingRankBar;
