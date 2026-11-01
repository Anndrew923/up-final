import type { FC } from 'react';
import { createPortal } from 'react-dom';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { cn } from '../../lib/cn';

export interface HomeSyncArrivalToastProps {
  open: boolean;
  fading: boolean;
  label: string;
}

/**
 * Non-blocking dyno-sync confirmation. Pointer events stay off so radar / tabs remain tappable.
 */
const HomeSyncArrivalToast: FC<HomeSyncArrivalToastProps> = ({ open, fading, label }) => {
  if (!open || label.trim().length === 0) return null;

  return createPortal(
    <div
      data-testid="console-sync-arrival-toast"
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top,24px))] ${Z_INDEX_CLASS.consoleSyncArrivalToast} flex justify-center px-4`}
    >
      <p
        className={cn(
          'rounded-lg border border-cyan-400/25 bg-zinc-950/90 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.45)]',
          fading ? 'animate-toast-slide-out' : 'animate-toast-slide-in',
          'motion-reduce:animate-none'
        )}
      >
        {label}
      </p>
    </div>,
    document.body
  );
};

export default HomeSyncArrivalToast;
