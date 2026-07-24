import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type ShellFlowStackProps = {
  /** Tailwind `space-y-*` for in-flow children only. */
  gapClassName?: string;
  className?: string;
  children: ReactNode;
};

/**
 * In-flow content stack for shell pages that also host absolute decor.
 *
 * WHY: Tailwind `space-y-*` on `<main>` still margins the first content child when an
 * absolute backdrop is a previous sibling (classic 16px “black gap” under card radii).
 * Keep stacking here — never on the shell root that owns decor / portal hosts.
 */
export const ShellFlowStack: FC<ShellFlowStackProps> = ({
  gapClassName = 'space-y-8',
  className,
  children,
}) => <div className={cn('relative z-10', gapClassName, className)}>{children}</div>;

export default ShellFlowStack;
