import type { FC, ReactNode } from 'react';

export type AssessmentTabBadgeTone = 'core' | 'specialty';

export interface AssessmentTabBadgeProps {
  tone: AssessmentTabBadgeTone;
  children: ReactNode;
  /** Tighter chip for single-row segmented controls. */
  compact?: boolean;
}

const TONE_CLASS: Record<AssessmentTabBadgeTone, string> = {
  core: 'border-accent-info/40 bg-accent-info/10 text-accent-info',
  specialty: 'border-amber-500/40 bg-amber-500/10 text-amber-200/90',
};

/**
 * Tab-mounted role chip — cyan = six-axis required, amber = specialty optional.
 * WHY: Shared across cardio / explosive so badge language stays one visual system.
 */
export const AssessmentTabBadge: FC<AssessmentTabBadgeProps> = ({
  tone,
  children,
  compact = false,
}) => (
  <span
    className={`shrink-0 rounded border font-medium tracking-wide ${TONE_CLASS[tone]} ${
      compact ? 'px-1 py-px text-[9px]' : 'px-1.5 py-0.5 text-[10px]'
    }`}
  >
    {children}
  </span>
);

export default AssessmentTabBadge;
