import type { FC } from 'react';
import { cn } from '../../lib/cn';
import NormBadgeChip, {
  type NormBadgeChevronTone,
  type NormBadgeChipSize,
} from '../common/NormBadgeChip';

export interface AssessmentHeroScoreWithNormBadgeProps {
  scoreText: string;
  populationClass?: string | null;
  decadeKey?: string | null;
  /**
   * preview — legacy isolated score row (text-2xl).
   * panel — integrated honor-core header inside AssessmentScoreMeaningPanel (glow + bold).
   * breakthrough — modal celebration numeral (text-4xl, centered).
   */
  variant?: 'preview' | 'panel' | 'breakthrough';
  /** Override badge size; breakthrough defaults to md for modal touch targets. */
  badgeSize?: NormBadgeChipSize;
  className?: string;
  /** Optional badge interactivity — assessment pages omit; breakthrough modal wires expand. */
  onBadgeClick?: () => void;
  badgeExpanded?: boolean;
  showChevron?: boolean;
  /** expand (modal accordion) vs forward (Hall spectrum drawer). Default expand. */
  chevronTone?: NormBadgeChevronTone;
  badgeAriaControls?: string;
  badgeAriaLabel?: string;
}

const SCORE_CLASS: Record<
  NonNullable<AssessmentHeroScoreWithNormBadgeProps['variant']>,
  string
> = {
  preview: 'font-mono text-2xl tabular-nums leading-none text-accent-info',
  // WHY: Spec-card honor core — weight + glow so the score reads as the primary instrument dial.
  panel:
    'font-mono text-2xl font-bold tabular-nums leading-none text-accent-info drop-shadow-[0_0_12px_rgba(34,211,238,0.45)]',
  breakthrough:
    'font-mono text-4xl font-bold tabular-nums leading-none text-aura-neon text-zinc-50',
};

/**
 * Single mount point for hero score + physiological norm badge.
 * WHY: Seven assessment pages + breakthrough modal shared the same row; centralizing prevents drift.
 */
const AssessmentHeroScoreWithNormBadge: FC<AssessmentHeroScoreWithNormBadgeProps> = ({
  scoreText,
  populationClass = null,
  decadeKey = null,
  variant = 'preview',
  badgeSize,
  className,
  onBadgeClick,
  badgeExpanded = false,
  showChevron = false,
  chevronTone = 'expand',
  badgeAriaControls,
  badgeAriaLabel,
}) => {
  const resolvedBadgeSize: NormBadgeChipSize =
    badgeSize ?? (variant === 'breakthrough' ? 'md' : 'sm');

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        // WHY: Preview/panel may wrap on narrow heroes; breakthrough keeps score+badge as one celebratory row.
        variant === 'breakthrough' ? 'flex-nowrap justify-center gap-2.5' : 'flex-wrap',
        className
      )}
    >
      <p className={SCORE_CLASS[variant]}>{scoreText}</p>
      <NormBadgeChip
        populationClass={populationClass ?? ''}
        decadeKey={decadeKey}
        size={resolvedBadgeSize}
        onClick={onBadgeClick}
        expanded={badgeExpanded}
        showChevron={showChevron}
        chevronTone={chevronTone}
        ariaControls={badgeAriaControls}
        ariaLabel={badgeAriaLabel}
      />
    </div>
  );
};

export default AssessmentHeroScoreWithNormBadge;
