import type { FC } from 'react';

/**
 * Soft top wash behind assessment / tool shells.
 *
 * WHY: Absolute layers still count as `space-y-*` siblings, so the *next* child
 * (usually `AssessmentPageHeader`) would get a 2rem top margin. Pair with the
 * `.assessment-ambient-glow + *` reset in `styles.css` so headers stay flush
 * like Grip/ArmSize (which historically omitted this wash).
 */
export const AssessmentAmbientGlow: FC = () => (
  <div
    className="assessment-ambient-glow pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.05]"
    aria-hidden
  >
    <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
  </div>
);

export default AssessmentAmbientGlow;
