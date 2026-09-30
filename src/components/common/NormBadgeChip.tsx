import type { FC, MouseEvent } from 'react';
import { cn } from '../../lib/cn';
import CollapsibleChevron from '../CollapsibleChevron';

export type NormBadgeChipSize = 'sm' | 'md';

export interface NormBadgeChipProps {
  populationClass: string;
  decadeKey?: string | null;
  className?: string;
  /**
   * sm — assessment page companion chip (quiet).
   * md — breakthrough modal hero (larger type + touch target).
   */
  size?: NormBadgeChipSize;
  /** When set, chip renders as an interactive button. */
  onClick?: () => void;
  expanded?: boolean;
  showChevron?: boolean;
  ariaControls?: string;
  /** Accessible name override (e.g. expand/collapse hint). Falls back to populationClass. */
  ariaLabel?: string;
}

/**
 * Decade → muted metal capsule tone.
 * WHY: Badge must read in 0.5s beside the score without competing with hero numerals.
 */
export function resolveNormBadgeToneClass(decadeKey: string | null | undefined): string {
  const decade = Number(decadeKey);
  if (!Number.isFinite(decade) || decade < 60) {
    return 'border-zinc-500/40 bg-zinc-800/70 text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';
  }
  if (decade < 70) {
    return 'border-sky-400/35 bg-sky-950/50 text-sky-200/90 shadow-[inset_0_1px_0_rgba(125,211,252,0.12)]';
  }
  if (decade < 100) {
    return 'border-amber-400/40 bg-amber-950/45 text-amber-200/90 shadow-[inset_0_1px_0_rgba(251,191,36,0.14)]';
  }
  if (decade < 120) {
    return 'border-orange-400/40 bg-orange-950/45 text-orange-200/90 shadow-[inset_0_1px_0_rgba(251,146,60,0.14)]';
  }
  if (decade < 140) {
    return 'border-violet-400/40 bg-violet-950/45 text-violet-200/90 shadow-[inset_0_1px_0_rgba(167,139,250,0.14)]';
  }
  return 'border-amber-300/45 bg-gradient-to-br from-amber-950/55 via-zinc-900/80 to-orange-950/40 text-amber-100/95 shadow-[inset_0_1px_0_rgba(253,230,138,0.18)]';
}

const SIZE_CLASS: Record<NormBadgeChipSize, string> = {
  sm: 'gap-1 px-2.5 py-0.5 text-[10px] tracking-[0.06em]',
  // WHY: Modal hero needs readable type + ≥44px-ish tap height beside text-4xl score.
  md: 'gap-1.5 px-3.5 py-1.5 text-sm tracking-[0.04em]',
};

const CHEVRON_CLASS: Record<NormBadgeChipSize, string> = {
  sm: 'h-3 w-3 shrink-0 opacity-80',
  md: 'h-3.5 w-3.5 shrink-0 opacity-80',
};

const CHIP_BASE_CLASS =
  'inline-flex max-w-full shrink-0 items-center rounded-full border font-semibold';

const NormBadgeChip: FC<NormBadgeChipProps> = ({
  populationClass,
  decadeKey = null,
  className,
  size = 'sm',
  onClick,
  expanded = false,
  showChevron = false,
  ariaControls,
  ariaLabel,
}) => {
  const label = String(populationClass ?? '').trim();
  if (!label) return null;

  const interactive = typeof onClick === 'function';
  const showChevronIcon = interactive && showChevron;
  const toneClass = resolveNormBadgeToneClass(decadeKey);
  const resolvedAriaLabel = String(ariaLabel ?? label).trim() || label;

  const content = (
    <>
      <span className="truncate">{label}</span>
      {showChevronIcon ? (
        <CollapsibleChevron expanded={expanded} className={CHEVRON_CLASS[size]} />
      ) : null}
    </>
  );

  if (interactive) {
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onClick();
    };

    return (
      <button
        type="button"
        className={cn(
          CHIP_BASE_CLASS,
          SIZE_CLASS[size],
          'cursor-pointer transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/50',
          toneClass,
          className
        )}
        // WHY: Prefer aria-label only — native title tooltip fights expand/collapse naming.
        aria-label={resolvedAriaLabel}
        aria-expanded={expanded}
        aria-controls={ariaControls}
        onClick={handleClick}
      >
        {content}
      </button>
    );
  }

  // WHY: Quiet companion chip — no role="status" (live region would re-announce on every score tick).
  return (
    <span
      aria-label={label}
      className={cn(CHIP_BASE_CLASS, SIZE_CLASS[size], toneClass, className)}
      title={label}
    >
      {content}
    </span>
  );
};

export default NormBadgeChip;
