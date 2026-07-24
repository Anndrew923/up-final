import type { CSSProperties, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { LADDER_FILTER_PILL_BOTTOM_PX, bottomChromeCalc } from '../../constants/bottomChrome';

type LadderFloatingFilterPillProps = {
  activeFilterCount: number;
  onOpen: () => void;
};

/**
 * Always-reachable filter CTA (WHY): Ladder title is in-flow again (no sticky), so once the
 * user scrolls the in-card「更多篩選」away they still need a one-tap path into LadderFilterSheet.
 * Bottom uses shared chrome math (+ safe-area) so the pill clears BottomNav / Dyno / bridge.
 */
export const LadderFloatingFilterPill: FC<LadderFloatingFilterPillProps> = ({
  activeFilterCount,
  onOpen,
}) => {
  const { t } = useTranslation();
  const label = t('ladder.moreFilters', { ns: 'common' });
  const style = {
    bottom: bottomChromeCalc(LADDER_FILTER_PILL_BOTTOM_PX),
  } satisfies CSSProperties;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onOpen}
      style={style}
      className="fixed right-4 z-40 flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-900/90 px-4 py-2 text-xs font-semibold text-cyan-400 shadow-xl backdrop-blur-md transition-all active:scale-95"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 fill-none stroke-current">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M7 12h10M10 18h4"
        />
      </svg>
      <span>{label}</span>
      {activeFilterCount > 0 ? (
        <span className="rounded-full border border-cyan-400/50 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
          {activeFilterCount}
        </span>
      ) : null}
    </button>
  );
};

export default LadderFloatingFilterPill;
