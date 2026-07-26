import type { CSSProperties, FC } from 'react';
import { TOOL_FLOATING_CTA_BOTTOM_PX, bottomChromeCalc } from '../../constants/bottomChrome';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';

export interface ToolFloatingCalculateCtaProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
}

/**
 * Floating primary calculate CTA above BottomNav (Dyno chip hidden on calculator routes).
 * WHY: Dock uses `TOOL_FLOATING_CTA_*` = BottomNav/hex stack only; `bottomChromeCalc` adds
 * `env(safe-area-inset-bottom, 0px)` for Android 15 edge-to-edge.
 */
const ToolFloatingCalculateCta: FC<ToolFloatingCalculateCtaProps> = ({
  label,
  disabled,
  onClick,
}) => {
  const dockStyle = {
    bottom: bottomChromeCalc(TOOL_FLOATING_CTA_BOTTOM_PX),
  } satisfies CSSProperties;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 ${Z_INDEX_CLASS.toolFloatingCta}`}
      style={dockStyle}
    >
      <div className="pointer-events-auto border-t border-zinc-800/50 bg-gradient-to-t from-bg-base/95 via-bg-base/80 to-bg-base/25 px-5 pb-3 pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
        <div className="mx-auto w-full max-w-3xl">
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            // WHY: nowrap + min-h-12 keeps dock height ≈ TOOL_FLOATING_CTA_BAR_PX for AppShell inset.
            className="ui-btn ui-btn-primary w-full min-h-12 whitespace-nowrap text-base font-semibold disabled:cursor-not-allowed"
          >
            {label}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolFloatingCalculateCta;
