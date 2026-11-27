import type { FC, ReactNode } from 'react';
import type { ScoreMeaningResult } from '../../hooks/useScoreMeaning';
import { resolveTierVisualPalette } from '../../logic/aesthetic/tierVisualPalette';
import { cn } from '../../lib/cn';
import AssessmentHeroScoreWithNormBadge, {
  type AssessmentHeroScoreWithNormBadgeProps,
} from './AssessmentHeroScoreWithNormBadge';

export interface HallSpectrumEntryAction {
  onClick: () => void;
  label: string;
  ariaLabel?: string;
}

/**
 * Integrated radar-axis score + NormBadge for the honor-core header.
 * WHY: Collapses the old isolated preview row into the spec card and kills box-in-box fatigue.
 */
export type AssessmentScoreMeaningHero = {
  scoreText: string;
  populationClass?: string | null;
  decadeKey?: string | null;
} & Pick<
  AssessmentHeroScoreWithNormBadgeProps,
  'onBadgeClick' | 'showChevron' | 'badgeAriaLabel' | 'badgeSize' | 'chevronTone'
>;

export interface AssessmentScoreMeaningPanelProps {
  meaning: ScoreMeaningResult;
  /** Omit when at max tier (no next milestone). */
  milestoneHintLabel?: string | null;
  /**
   * Scheme B — primary Hall Spectrum entry on the spec-card header.
   * WHY: Null/undefined hides the CTA (incomplete score, 5km specialty, etc.).
   */
  hallEntry?: HallSpectrumEntryAction | null;
  /** Integrated hero score + NormBadge (left column). Required on all seven assessment pages. */
  hero?: AssessmentScoreMeaningHero | null;
  /**
   * @deprecated Prefer `hero`. Mono kicker only when `hero` is absent (tests / legacy fallback).
   * Production pages must not pass this — scheduled for removal once call sites are zero.
   */
  headerLabel?: string;
}

/**
 * Ghost Hall Spectrum entry — no border slab so the header stays score-first.
 * WHY: Former amber outline competed with NormBadge + tier panel chrome on narrow phones.
 */
export const HALL_SPECTRUM_ENTRY_BUTTON_CLASS =
  'inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md px-1.5 text-xs font-medium tracking-wide text-amber-300/90 drop-shadow-[0_0_8px_rgba(251,191,36,0.28)] transition-[color,filter,opacity] hover:text-amber-200 hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60';

/** Spec-card Hall entry — keeps seven pages + breakthrough modal visually identical. */
export const HallSpectrumEntryButton: FC<HallSpectrumEntryAction & { className?: string }> = ({
  onClick,
  label,
  ariaLabel,
  className,
}) => (
  <button
    type="button"
    className={cn(HALL_SPECTRUM_ENTRY_BUTTON_CLASS, className)}
    aria-label={String(ariaLabel ?? label).trim() || label}
    onClick={onClick}
  >
    {label}
  </button>
);

/** Highlight numeric tokens in milestone copy without saturating the whole line. */
export function highlightMilestoneNumerals(label: string): ReactNode {
  const parts = String(label).split(/(\d+(?:\.\d+)?)/g);
  if (parts.length <= 1) return label;
  return parts.map((part, index) =>
    /^\d/.test(part) ? (
      <span key={`n-${index}`} className="font-mono tabular-nums text-zinc-200">
        {part}
      </span>
    ) : (
      <span key={`t-${index}`}>{part}</span>
    )
  );
}

const AssessmentScoreMeaningPanel: FC<AssessmentScoreMeaningPanelProps> = ({
  meaning,
  milestoneHintLabel = null,
  hallEntry = null,
  hero = null,
  headerLabel,
}) => {
  const decadeKey = hero?.decadeKey ?? meaning.decadeKey;
  const styles = resolveTierVisualPalette(decadeKey);
  const hasHero = hero != null && String(hero.scoreText).trim().length > 0;

  return (
    <section
      className={`relative overflow-hidden rounded-xl border bg-zinc-950/85 p-4 ${styles.panelSectionClass}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${styles.panelGradientClass} to-transparent`}
        aria-hidden
      />
      {/* WHY: Rigid 2-col grid — never flex-wrap hero/score + Hall CTA on narrow phones. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        {hasHero && hero ? (
          <AssessmentHeroScoreWithNormBadge
            scoreText={hero.scoreText}
            populationClass={hero.populationClass}
            decadeKey={hero.decadeKey}
            variant="panel"
            badgeSize={hero.badgeSize}
            onBadgeClick={hero.onBadgeClick}
            showChevron={hero.showChevron}
            chevronTone={hero.chevronTone}
            badgeAriaLabel={hero.badgeAriaLabel}
            className="min-w-0"
          />
        ) : headerLabel ? (
          <p
            className={cn(
              'min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.28em]',
              styles.scoreTextClass,
              'opacity-90'
            )}
          >
            {headerLabel}
          </p>
        ) : (
          <span className="min-w-0" />
        )}
        {hallEntry ? <HallSpectrumEntryButton {...hallEntry} /> : null}
      </div>
      <h3 className="mt-3 text-base font-semibold tracking-tight text-zinc-50">{meaning.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{meaning.summary}</p>
      {milestoneHintLabel != null &&
      meaning.nextMilestone !== null &&
      meaning.remainingPoints !== null ? (
        <p className="mt-3 border-t border-zinc-800/90 pt-3 text-xs font-medium text-zinc-400">
          {highlightMilestoneNumerals(milestoneHintLabel)}
        </p>
      ) : null}
    </section>
  );
};

export default AssessmentScoreMeaningPanel;
