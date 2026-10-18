import type { FC } from 'react';
import { cn } from '../../lib/cn';

export interface RadarPkScanOverlayProps {
  open: boolean;
  statusLine: string;
  kickerLabel: string;
  ariaLabel: string;
  className?: string;
}

/**
 * Lightweight local HUD scan veil over the hex radar (not full-viewport).
 * WHY: Mirrors assessment DiagnosticOverlay beam + mono copy without shell scroll-lock.
 */
const RadarPkScanOverlay: FC<RadarPkScanOverlayProps> = ({
  open,
  statusLine,
  kickerLabel,
  ariaLabel,
  className,
}) => {
  if (!open) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-md',
        className
      )}
      data-testid="radar-pk-scan-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className="absolute inset-0 bg-zinc-950/55 backdrop-blur-[1px]" aria-hidden />

      <div
        className={cn(
          'absolute inset-0 opacity-50 motion-safe:animate-pulse motion-reduce:animate-none',
          'bg-[length:18px_18px]',
          'bg-[linear-gradient(to_right,rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.08)_1px,transparent_1px)]'
        )}
        aria-hidden
      />

      <div
        className="absolute inset-x-0 top-0 h-[42%] overflow-hidden motion-reduce:hidden"
        aria-hidden
      >
        <div
          className={cn(
            'h-16 w-full bg-gradient-to-b from-cyan-400/35 via-amber-400/20 to-transparent',
            'motion-safe:animate-diagnostic-scan will-change-transform'
          )}
        />
      </div>

      <div className="absolute inset-3" aria-hidden>
        <span className="absolute left-0 top-0 h-5 w-5 border-l border-t border-cyan-400/70" />
        <span className="absolute right-0 top-0 h-5 w-5 border-r border-t border-cyan-400/70" />
        <span className="absolute bottom-0 left-0 h-5 w-5 border-b border-l border-amber-400/60" />
        <span className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-amber-400/60" />
      </div>

      <div className="absolute inset-x-3 bottom-3 text-center sm:inset-x-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-cyan-400/80">
          {kickerLabel}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-100/90">
          {statusLine}
        </p>
      </div>
    </div>
  );
};

export default RadarPkScanOverlay;
