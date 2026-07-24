import type { FC } from 'react';

/**
 * Soft top wash behind assessment / tool shells.
 *
 * WHY: Absolute layers still count as `space-y-*` siblings, so the *next* child
 * (usually `AssessmentPageHeader`) would get unwanted top margin. Pair with the
 * `.shell-absolute-layer + *` reset in `styles.css`.
 */
export const AssessmentAmbientGlow: FC = () => (
  <div
    className="shell-absolute-layer pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.05]"
    aria-hidden
  >
    <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
  </div>
);

export default AssessmentAmbientGlow;
