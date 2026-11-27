import type { FC } from 'react';
import { resolveTierVisualPalette } from '../../logic/aesthetic/tierVisualPalette';
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
   * panel — integrated honor-core header inside AssessmentScoreMeaningPanel (tier chroma + glow).
   * breakthrough — modal celebration numeral (neon white; intentionally not tier-tinted).
   */
  variant?: 'panel' | 'breakthrough';
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

/**
 * Single mount point for hero score + physiological norm badge.
 * WHY: Seven assessment pages + breakthrough modal shared the same row; centralizing prevents drift.
 */
const AssessmentHeroScoreWithNormBadge: FC<AssessmentHeroScoreWithNormBadgeProps> = ({
  scoreText,
  populationClass = null,
  decadeKey = null,
  variant = 'panel',
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
  const palette = resolveTierVisualPalette(decadeKey);

  const scoreClass =
    variant === 'breakthrough'
      ? // WHY: Breakthrough stays neon celebration — distinct from page honor-card tier chroma.
        'font-mono text-4xl font-bold tabular-nums leading-none text-aura-neon text-zinc-50'
      : // WHY: Spec-card honor core — tier chroma + glow so score and badge share one ladder.
        cn(
          'font-mono text-2xl font-bold tabular-nums leading-none',
          palette.scoreTextClass,
          palette.scoreGlowClass
        );

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        // WHY: Panel may wrap on narrow heroes; breakthrough keeps score+badge as one celebratory row.
        variant === 'breakthrough' ? 'flex-nowrap justify-center gap-2.5' : 'flex-wrap',
        className
      )}
    >
      <p className={scoreClass}>{scoreText}</p>
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
