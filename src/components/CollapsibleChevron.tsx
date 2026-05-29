import type { FC } from 'react';

export interface CollapsibleChevronProps {
  expanded: boolean;
  className?: string;
}

/** Shared expand/collapse affordance for home cards and nested disclosure panels. */
export const CollapsibleChevron: FC<CollapsibleChevronProps> = ({
  expanded,
  className = 'h-4 w-4 shrink-0 text-accent-primary/90',
}) => (
  <svg
    className={`${className} transition-transform duration-200 motion-reduce:transition-none ${
      expanded ? 'rotate-180' : ''
    }`}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

export default CollapsibleChevron;
