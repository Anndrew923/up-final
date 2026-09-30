import type { FC } from 'react';
import type { ScoreMeaningResult } from '../../hooks/useScoreMeaning';
import { cn } from '../../lib/cn';
import AssessmentHeroScoreWithNormBadge, {
  type AssessmentHeroScoreWithNormBadgeProps,
} from './AssessmentHeroScoreWithNormBadge';

export type AssessmentScoreMeaningTone = 'orange' | 'cyan' | 'blue' | 'violet' | 'amber' | 'slate';

const TONE_STYLES: Record<
  AssessmentScoreMeaningTone,
  { section: string; gradient: string; header: string; milestone: string }
> = {
  orange: {
    section:
      'border-orange-400/35 shadow-[inset_0_1px_0_rgba(251,146,60,0.22),0_0_30px_rgba(249,115,22,0.16)]',
    gradient: 'via-orange-400/70',
    header: 'text-orange-300/90',
    milestone: 'text-orange-300',
  },
  cyan: {
    section:
      'border-accent-info/35 shadow-[inset_0_1px_0_rgba(56,189,248,0.2),0_0_28px_rgba(34,211,238,0.12)]',
    gradient: 'via-cyan-400/65',
    header: 'text-cyan-300/90',
    milestone: 'text-cyan-300',
  },
  blue: {
    section: 'border-blue-400/35 shadow-[0_0_25px_rgba(59,130,246,0.15)]',
    gradient: 'via-blue-400/65',
    header: 'text-blue-300/90',
    milestone: 'text-blue-300',
  },
  violet: {
    section:
      'border-violet-400/35 shadow-[inset_0_1px_0_rgba(167,139,250,0.22),0_0_28px_rgba(139,92,246,0.14)]',
    gradient: 'via-violet-400/65',
    header: 'text-violet-300/90',
    milestone: 'text-violet-300',
  },
  amber: {
    section:
      'border-amber-400/35 shadow-[inset_0_1px_0_rgba(251,191,36,0.2),0_0_28px_rgba(245,158,11,0.14)]',
    gradient: 'via-amber-400/65',
    header: 'text-amber-300/90',
    milestone: 'text-amber-300',
  },
  slate: {
    section:
      'border-zinc-500/40 shadow-[inset_0_1px_0_rgba(161,161,170,0.15),0_0_24px_rgba(113,113,122,0.12)]',
    gradient: 'via-zinc-400/55',
    header: 'text-zinc-300/90',
    milestone: 'text-zinc-300',
  },
};

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
  tone: AssessmentScoreMeaningTone;
  /**
   * Scheme B — primary Hall Spectrum entry on the spec-card header.
   * WHY: Null/undefined hides the CTA (incomplete score, 5km specialty, etc.).
   */
  hallEntry?: HallSpectrumEntryAction | null;
  /** Integrated hero score + NormBadge (left column). Preferred over demoted headerLabel. */
  hero?: AssessmentScoreMeaningHero | null;
  /**
   * Optional mono kicker — only rendered when `hero` is absent.
   * WHY: Demoted; integrated hero replaces the old headerLabel + isolated score stack.
   */
  headerLabel?: string;
}

/** Shared ghost CTA class for Hall Spectrum entry buttons. */
export const HALL_SPECTRUM_ENTRY_BUTTON_CLASS =
  'inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md border border-amber-500/40 px-2.5 text-xs font-medium tracking-wide text-amber-300 transition-colors hover:bg-amber-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60';

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

const AssessmentScoreMeaningPanel: FC<AssessmentScoreMeaningPanelProps> = ({
  meaning,
  milestoneHintLabel = null,
  tone,
  hallEntry = null,
  hero = null,
  headerLabel,
}) => {
  const styles = TONE_STYLES[tone];
  const hasHero = hero != null && String(hero.scoreText).trim().length > 0;

  return (
    <section
      className={`relative overflow-hidden rounded-xl border bg-zinc-950/85 p-4 ${styles.section}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${styles.gradient} to-transparent`}
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
              styles.header
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
        <p
          className={`mt-3 border-t border-zinc-800/90 pt-3 text-xs font-medium ${styles.milestone}`}
        >
          {milestoneHintLabel}
        </p>
      ) : null}
    </section>
  );
};

export default AssessmentScoreMeaningPanel;
