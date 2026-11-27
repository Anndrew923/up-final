import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import AssessmentWriteToRadarButton, {
  type AssessmentWriteToRadarButtonProps,
} from './AssessmentWriteToRadarButton';

export type AssessmentRadarCtaRowProps = Omit<AssessmentWriteToRadarButtonProps, 'className'> & {
  /**
   * Secondary report CTA (single-leaf / axis-summary). When null, Write-to-Radar spans full width.
   * WHY: Dual row keeps generate-report out of the honor card so title copy is never waist-cut.
   */
  secondary?: ReactNode;
  /** Optional status line under the button row (e.g. submitDone). */
  status?: ReactNode;
  /** Outer row wrapper classes (not forwarded to Write-to-Radar). */
  className?: string;
};

/**
 * Assessment footer CTAs — secondary dark-gold report + primary solid Write-to-Radar.
 * WHY: One mount point across seven pages prevents afterHero / full-width drift.
 */
const AssessmentRadarCtaRow: FC<AssessmentRadarCtaRowProps> = ({
  secondary = null,
  status = null,
  className,
  ...writeProps
}) => {
  const hasSecondary = secondary != null;

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'flex items-stretch gap-2',
          // WHY: Keep a single row on narrow phones — flex ratio carries hierarchy, not wrap.
          'flex-nowrap'
        )}
      >
        {hasSecondary ? (
          <div className="flex min-w-0 flex-1 items-stretch [&_button]:h-12 [&_button]:w-full">
            {secondary}
          </div>
        ) : null}
        <div className={cn('min-w-0', hasSecondary ? 'flex-[1.35]' : 'w-full')}>
          <AssessmentWriteToRadarButton {...writeProps} className="w-full" />
        </div>
      </div>
      {status}
    </div>
  );
};

export default AssessmentRadarCtaRow;
