import { type CSSProperties, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LADDER_BRIDGE_BOTTOM_PX,
  bottomChromeCalc,
} from '../../constants/bottomChrome';
import { cn } from '../../lib/cn';

export interface CrewFloatingYouBarProps {
  myRank: number;
  myScoreLabel: string;
  displayName: string;
  avatarUrl?: string;
  onJumpToMyRow: () => void;
}

/**
 * Club sticky “You” bar — cyan identity strip aligned with global ladder chrome geometry.
 * WHY: Club list lives above BottomNav/DYNO; reuse `LADDER_BRIDGE_BOTTOM_PX` so the bar clears hex.
 * No arch clip — club page has no dual-CTA / filter-exclusion states to reserve for.
 */
const CrewFloatingYouBar: FC<CrewFloatingYouBarProps> = ({
  myRank,
  myScoreLabel,
  displayName,
  avatarUrl,
  onJumpToMyRow,
}) => {
  const { t } = useTranslation('common');
  const jumpLabel = t('crew.ladder.floatingYou.cta');
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || '?';

  const shellStyle = {
    bottom: bottomChromeCalc(LADDER_BRIDGE_BOTTOM_PX),
  } satisfies CSSProperties;

  return (
    <button
      type="button"
      data-testid="crew-floating-you-bar"
      onClick={onJumpToMyRow}
      className={cn(
        'pointer-events-auto fixed inset-x-3 z-30 mx-auto flex w-full max-w-3xl items-center justify-between gap-3 sm:inset-x-4',
        'border border-cyan-400/40 bg-slate-900/95 px-3 py-2.5 text-left backdrop-blur-md',
        'shadow-[0_0_24px_rgba(34,211,238,0.18)]',
        'motion-safe:transition-[border-color,transform] motion-safe:duration-150',
        'hover:border-cyan-400/55 active:scale-[0.99]',
        'rounded-xl'
      )}
      style={shellStyle}
      aria-label={jumpLabel}
      title={jumpLabel}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="font-mono text-sm font-bold tabular-nums text-cyan-300">#{myRank}</span>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            aria-hidden
            className="h-9 w-9 shrink-0 rounded-full border border-cyan-400/35 object-cover shadow-[0_0_10px_rgba(34,211,238,0.2)]"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/35 bg-slate-800 text-sm font-semibold text-cyan-200"
          >
            {avatarInitial}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight text-zinc-100">
            {displayName}
          </span>
          <span className="block truncate text-[10px] text-cyan-400/75">
            {t('crew.ladder.floatingYou.subline')}
          </span>
        </span>
      </span>
      <span className="shrink-0 font-mono text-base font-semibold tabular-nums leading-tight text-cyan-300">
        {myScoreLabel}
      </span>
    </button>
  );
};

export default CrewFloatingYouBar;
