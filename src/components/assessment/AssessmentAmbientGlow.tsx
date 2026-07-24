import type { FC } from 'react';

/**
 * Soft top wash behind assessment / tool shells.
 *
 * Pair with `ShellFlowStack` as a sibling — never put this node under the same
 * `space-y-*` parent as page content (absolute layers still participate in space-y).
 */
export const AssessmentAmbientGlow: FC = () => (
  <div
    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.05]"
    aria-hidden
  >
    <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
  </div>
);

export default AssessmentAmbientGlow;
