import type { FC, MouseEvent } from 'react';
import { cn } from '../../lib/cn';
import CollapsibleChevron from '../CollapsibleChevron';

export type NormBadgeChipSize = 'sm' | 'md';
/** expand — breakthrough accordion ∨; forward — Hall spectrum opens a new layer ›. */
export type NormBadgeChevronTone = 'expand' | 'forward';

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
  /**
   * expand (default) — CollapsibleChevron for modal accordion.
   * forward — right chevron for Hall drawer entry (does not rotate).
   */
  chevronTone?: NormBadgeChevronTone;
  ariaControls?: string;
  /** Accessible name override (e.g. expand/collapse hint). Falls back to populationClass. */
  ariaLabel?: string;
}

/**
 * Decade → translucent metallic capsule tone.
 * WHY: Must read in 0.5s beside the score with honor/instrument presence — never a dull brown slab.
 * @param interactive When true, appends hue-matched hover fills (never force amber over sky/violet).
 */
export function resolveNormBadgeToneClass(
  decadeKey: string | null | undefined,
  interactive = false
): string {
  const decade = Number(decadeKey);
  const hover = (fill: string) => (interactive ? ` ${fill}` : '');

  if (!Number.isFinite(decade) || decade < 60) {
    return `border-zinc-400/45 bg-zinc-500/10 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]${hover('hover:bg-zinc-500/20')}`;
  }
  if (decade < 70) {
    return `border-sky-400/45 bg-sky-500/10 text-sky-300 shadow-[inset_0_1px_0_rgba(125,211,252,0.18)] drop-shadow-[0_0_6px_rgba(56,189,248,0.25)]${hover('hover:bg-sky-500/20')}`;
  }
  if (decade < 100) {
    return `border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[inset_0_1px_0_rgba(251,191,36,0.2)] drop-shadow-[0_0_6px_rgba(251,191,36,0.28)]${hover('hover:bg-amber-500/20')}`;
  }
  if (decade < 120) {
    return `border-orange-400/50 bg-orange-500/10 text-orange-300 shadow-[inset_0_1px_0_rgba(251,146,60,0.2)] drop-shadow-[0_0_6px_rgba(251,146,60,0.28)]${hover('hover:bg-orange-500/20')}`;
  }
  if (decade < 140) {
    return `border-violet-400/50 bg-violet-500/10 text-violet-300 shadow-[inset_0_1px_0_rgba(167,139,250,0.2)] drop-shadow-[0_0_6px_rgba(167,139,250,0.28)]${hover('hover:bg-violet-500/20')}`;
  }
  return `border-amber-300/55 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/10 text-amber-200 shadow-[inset_0_1px_0_rgba(253,230,138,0.22)] drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]${hover('hover:from-amber-500/25 hover:via-amber-500/10 hover:to-orange-500/15')}`;
}

const SIZE_CLASS: Record<NormBadgeChipSize, string> = {
  sm: 'gap-1 px-2.5 py-0.5 text-[10px] tracking-[0.06em]',
  // WHY: Modal hero needs readable type + ≥44px-ish tap height beside text-4xl score.
  md: 'gap-1.5 px-3.5 py-1.5 text-sm tracking-[0.04em]',
};

const CHEVRON_CLASS: Record<NormBadgeChipSize, string> = {
  sm: 'h-3 w-3 shrink-0 opacity-90',
  md: 'h-3.5 w-3.5 shrink-0 opacity-90',
};

const CHIP_BASE_CLASS =
  'inline-flex max-w-full shrink-0 items-center rounded-full border font-semibold';

const INTERACTIVE_BASE_CLASS =
  'cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60';

/** Forward › — Hall spectrum opens a new layer; never rotates with accordion state. */
const ForwardChevron: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path
      fillRule="evenodd"
      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
      clipRule="evenodd"
    />
  </svg>
);

const NormBadgeChip: FC<NormBadgeChipProps> = ({
  populationClass,
  decadeKey = null,
  className,
  size = 'sm',
  onClick,
  expanded = false,
  showChevron = false,
  chevronTone = 'expand',
  ariaControls,
  ariaLabel,
}) => {
  const label = String(populationClass ?? '').trim();
  if (!label) return null;

  const interactive = typeof onClick === 'function';
  const showChevronIcon = interactive && showChevron;
  const toneClass = resolveNormBadgeToneClass(decadeKey, interactive);
  const resolvedAriaLabel = String(ariaLabel ?? label).trim() || label;
  const isExpandTone = chevronTone === 'expand';

  const content = (
    <>
      <span className="truncate">{label}</span>
      {showChevronIcon ? (
        isExpandTone ? (
          <CollapsibleChevron expanded={expanded} className={CHEVRON_CLASS[size]} />
        ) : (
          <ForwardChevron className={CHEVRON_CLASS[size]} />
        )
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
          INTERACTIVE_BASE_CLASS,
          toneClass,
          className
        )}
        // WHY: Prefer aria-label only — native title tooltip fights expand/collapse naming.
        aria-label={resolvedAriaLabel}
        aria-expanded={isExpandTone ? expanded : undefined}
        aria-controls={isExpandTone ? ariaControls : undefined}
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
