import type { FC } from 'react';
import { cn } from '../../lib/cn';

export interface RadarPkCompareLegendProps {
  memberLabel: string;
  /**
   * Viewer-side label — prefer local displayName; i18n fallback “我 / Me”.
   * WHY: First-person immersion beats a detached “You”.
   */
  viewerLabel: string;
  ariaLabel: string;
  /** Distinct test id for club vs global surfaces. */
  testId?: string;
  className?: string;
}

/**
 * Shared cyan/amber compare legend for opt-in PK radar overlays.
 * WHY: Club sheet + global preview must stay visually identical without duplicated markup.
 */
const RadarPkCompareLegend: FC<RadarPkCompareLegendProps> = ({
  memberLabel,
  viewerLabel,
  ariaLabel,
  testId = 'radar-pk-compare-legend',
  className,
}) => (
  <ul
    className={cn(
      'flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-400',
      className
    )}
    data-testid={testId}
    aria-label={ariaLabel}
  >
    <li className="inline-flex items-center gap-1.5">
      {/* Solid cyan-400 — matches quiet target ice plate (#22d3ee). */}
      <span
        className="inline-block h-2 w-2 rounded-full bg-cyan-400"
        data-testid="radar-pk-legend-target-swatch"
        aria-hidden
      />
      <span>{memberLabel}</span>
    </li>

    <li className="inline-flex items-center gap-1.5">
      {/* Solid amber-500 — matches quiet PK gold stroke (#f59e0b), not ritual dashed outline. */}
      <span
        className="inline-block h-2 w-2 rounded-full bg-amber-500"
        data-testid="radar-pk-legend-viewer-swatch"
        aria-hidden
      />
      <span>{viewerLabel}</span>
    </li>

  </ul>
);

export default RadarPkCompareLegend;
