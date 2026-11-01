import { cn } from '../../lib/cn';
import { CONSOLE_CTA_SWEEP_CLASS } from './consoleCtaChrome';

interface ConsoleCtaChevronProps {
  className?: string;
}

/**
 * Shared right-pointing stroke chevron for console CTAs.
 * WHY: Fitness foil and telemetry amber must sit on the same raster so tab switches do not jump.
 */
export function ConsoleCtaChevron({ className }: ConsoleCtaChevronProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn('relative z-10 h-4 w-4 shrink-0', className)}
      aria-hidden="true"
    >
      <path
        d="M4 10h11M11 6l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Static plate sheen — no loop, so the radar keeps visual priority. */
export function ConsoleCtaSweep() {
  return <div data-testid="console-cta-sweep" className={CONSOLE_CTA_SWEEP_CLASS} aria-hidden="true" />;
}
