import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { PerformanceAuraKey } from '../../logic/core/performanceAura';
import { AURA_THEME, auraNeonCssVars } from './auraThemeTokens';

export interface TachometerMilestoneBarProps {
  progress01: number;
  remainingPoints: number | null;
  auraKey?: PerformanceAuraKey;
  animate?: boolean;
  /**
   * Optional axis-specific upgrade guide (e.g. grip kg / explosive cm deltas).
   * When set, replaces the default points-only breakthrough copy below the bar.
   */
  milestoneHintLabel?: string | null;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Tachometer-style milestone bar — scaleX fill on compositor layer (GPU-friendly).
 */
const TachometerMilestoneBar: FC<TachometerMilestoneBarProps> = ({
  progress01,
  remainingPoints,
  auraKey = 'none',
  animate = true,
  milestoneHintLabel = null,
}) => {
  const { t } = useTranslation('common');
  const theme = AURA_THEME[auraKey];
  const safeProgress = Math.min(1, Math.max(0, progress01));
  const atPeak = remainingPoints === null;
  const skipFillAnimation = !animate || prefersReducedMotion();
  const [filled, setFilled] = useState(skipFillAnimation ? safeProgress : 0);

  useEffect(() => {
    if (skipFillAnimation) {
      setFilled(safeProgress);
      return;
    }
    const id = window.requestAnimationFrame(() => setFilled(safeProgress));
    return () => window.cancelAnimationFrame(id);
  }, [skipFillAnimation, safeProgress]);

  const hintLabel = atPeak
    ? t('assessment.breakthrough.peakReached')
    : milestoneHintLabel != null && milestoneHintLabel !== ''
      ? milestoneHintLabel
      : t('assessment.breakthrough.milestoneRemaining', { points: remainingPoints });

  return (
    <div style={auraNeonCssVars(theme.neonRgb)}>
      <div className="relative h-4 overflow-hidden rounded-full bg-zinc-900/90 ring-1 ring-inset ring-zinc-700/60">
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 w-full origin-left rounded-full ${theme.barFill} tachometer-fill-glow motion-reduce:transition-none transition-transform duration-[880ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform`}
          style={{ transform: `scaleX(${filled})` }}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-white/25 via-white/10 to-transparent motion-reduce:animate-none animate-tachometer-glow-pulse will-change-[transform,opacity] motion-reduce:transition-none transition-transform duration-[880ms] ease-[cubic-bezier(0.22,1,0.36,1)]`}
          style={{ transform: `scaleX(${filled})` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 flex justify-between px-0.5"
          aria-hidden
        >
          {Array.from({ length: 11 }).map((_, index) => (
            <span key={index} className="h-full w-px bg-zinc-950/50" />
          ))}
        </div>
      </div>
      {/*
        WHY: Amber copy matches AssessmentScoreMeaningPanel mission-target chroma; no chip/box —
        full-width centered plain text avoids asymmetric capsule / false-button silhouette.
      */}
      <p
        className="mt-3.5 mb-5 flex w-full items-center justify-center text-center text-xs font-medium tracking-wide text-amber-300 text-balance leading-relaxed"
        data-testid="tachometer-milestone-hint"
      >
        {hintLabel}
      </p>
    </div>
  );
};

export default TachometerMilestoneBar;
