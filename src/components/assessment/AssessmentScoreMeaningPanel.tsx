import type { FC } from 'react';
import type { ScoreMeaningResult } from '../../hooks/useScoreMeaning';

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

export interface AssessmentScoreMeaningPanelProps {
  headerLabel: string;
  meaning: ScoreMeaningResult;
  /** Omit when at max tier (no next milestone). */
  milestoneHintLabel?: string | null;
  tone: AssessmentScoreMeaningTone;
}

const AssessmentScoreMeaningPanel: FC<AssessmentScoreMeaningPanelProps> = ({
  headerLabel,
  meaning,
  milestoneHintLabel = null,
  tone,
}) => {
  const styles = TONE_STYLES[tone];

  return (
    <section
      className={`relative overflow-hidden rounded-xl border bg-zinc-950/85 p-4 ${styles.section}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${styles.gradient} to-transparent`}
        aria-hidden
      />
      <p className={`font-mono text-[10px] uppercase tracking-[0.28em] ${styles.header}`}>
        {headerLabel}
      </p>
      <h3 className="mt-2 text-base font-semibold tracking-tight text-zinc-50">{meaning.title}</h3>
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
