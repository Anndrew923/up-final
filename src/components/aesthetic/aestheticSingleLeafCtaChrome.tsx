/**
 * Shared champagne-foil CTA chrome for single-leaf report triggers.
 * WHY: Assessment page buttons and breakthrough modal must stay visually identical
 * without duplicating long Tailwind class strings / camera SVG paths.
 */
import type { FC } from 'react';
import { cn } from '../../lib/cn';

/** Compact full-width trigger (score panel / lift card). */
export const AESTHETIC_SINGLE_LEAF_CTA_CLASS =
  'ui-btn inline-flex h-9 w-full items-center justify-center gap-1.5 border border-amber-400/65 bg-gradient-to-b from-amber-500/18 to-amber-700/10 px-3 text-xs font-medium tracking-wide text-amber-100 shadow-[inset_0_1px_0_rgba(251,191,36,0.22),0_0_18px_rgba(245,158,11,0.12)] hover:border-amber-300/80 hover:from-amber-500/28 hover:to-amber-700/16 hover:text-amber-50 disabled:pointer-events-none disabled:opacity-40';

/** Taller breakthrough-modal variant. */
export const AESTHETIC_SINGLE_LEAF_CTA_MODAL_CLASS =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-400/65 bg-gradient-to-b from-amber-500/18 to-amber-700/10 py-3 text-sm font-medium tracking-wide text-amber-100 shadow-[inset_0_1px_0_rgba(251,191,36,0.22),0_0_18px_rgba(245,158,11,0.12)] transition-all duration-200 hover:border-amber-300/80 hover:from-amber-500/28 hover:text-amber-50 disabled:pointer-events-none disabled:opacity-40';

export const AestheticSingleLeafCtaIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('size-3.5 shrink-0 text-amber-200', className)}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4.5 8.25h2.1l1.05-1.8h6.7l1.05 1.8h2.1A1.75 1.75 0 0 1 19.25 10v7.25A1.75 1.75 0 0 1 17.5 19H6.5A1.75 1.75 0 0 1 4.75 17.25V10A1.75 1.75 0 0 1 6.5 8.25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13.25" r="2.75" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
