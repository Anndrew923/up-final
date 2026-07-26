import type { CSSProperties, FC } from 'react';
import { JOIN_ARENA_CTA_BOTTOM_PX, bottomChromeCalc } from '../../constants/bottomChrome';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { cn } from '../../lib/cn';

export interface JoinArenaFloatingCtaProps {
  label: string;
  disabled: boolean;
  motionOn: boolean;
  onClick: () => void;
}

/**
 * Sticky enter CTA above BottomNav (WHY): Keep the primary arena action reachable while
 * the Join Arena page scrolls; chrome offset shares `bottomChrome` math with Ladder / Dyno.
 */
const JoinArenaFloatingCta: FC<JoinArenaFloatingCtaProps> = ({
  label,
  disabled,
  motionOn,
  onClick,
}) => {
  const dockStyle = {
    bottom: bottomChromeCalc(JOIN_ARENA_CTA_BOTTOM_PX),
  } satisfies CSSProperties;

  return (
    <div
      className={cn('pointer-events-none fixed inset-x-0', Z_INDEX_CLASS.joinArenaFloatingCta)}
      style={dockStyle}
    >
      <div className="pointer-events-auto border-t border-zinc-800/50 bg-gradient-to-t from-bg-base/95 via-bg-base/80 to-bg-base/25 px-5 pb-3 pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              // WHY: nowrap keeps dock height = JOIN_ARENA_CTA_BAR_PX so AppShell scroll inset stays aligned.
              'group relative w-full overflow-hidden whitespace-nowrap rounded-xl border border-accent-primary/80 px-6 py-3.5 text-sm font-bold text-black shadow-[0_0_28px_rgba(255,140,0,0.4)] transition hover:shadow-[0_0_36px_rgba(255,140,0,0.55)] disabled:cursor-not-allowed disabled:border-zinc-700 disabled:shadow-none',
              disabled && 'bg-zinc-800 text-zinc-500',
            )}
          >
            {!disabled ? (
              <>
                <span
                  className={cn(
                    'pointer-events-none absolute inset-0 bg-gradient-to-r from-accent-primary via-amber-300 to-orange-500 bg-[length:200%_200%]',
                    motionOn && 'animate-arena-cta-shimmer',
                  )}
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)] opacity-60"
                  aria-hidden
                />
              </>
            ) : null}
            <span className="relative z-[1]">{label}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinArenaFloatingCta;
