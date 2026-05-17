import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface TachometerMilestoneBarProps {
  progress01: number;
  remainingPoints: number | null;
  animate?: boolean;
}

/**
 * Tachometer-style milestone bar — scaleX only (GPU-friendly).
 */
const TachometerMilestoneBar: FC<TachometerMilestoneBarProps> = ({
  progress01,
  remainingPoints,
  animate = true,
}) => {
  const { t } = useTranslation('common');
  const safeProgress = Math.min(1, Math.max(0, progress01));
  const atPeak = remainingPoints === null;
  const [filled, setFilled] = useState(animate ? 0 : safeProgress);

  useEffect(() => {
    if (!animate) {
      setFilled(safeProgress);
      return;
    }
    const id = window.requestAnimationFrame(() => setFilled(safeProgress));
    return () => window.cancelAnimationFrame(id);
  }, [animate, safeProgress]);

  return (
    <div className="space-y-2">
      <div className="relative h-3 overflow-hidden rounded-full bg-zinc-800/90">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-accent-primary/80 via-accent-info/90 to-accent-primary motion-reduce:transition-none transition-transform duration-700 ease-out will-change-transform"
          style={{ transform: `scaleX(${filled})` }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 flex justify-between px-1" aria-hidden>
          {Array.from({ length: 11 }).map((_, index) => (
            <span key={index} className="h-full w-px bg-zinc-950/35" />
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-zinc-400">
        {atPeak
          ? t('assessment.breakthrough.peakReached')
          : t('assessment.breakthrough.milestoneRemaining', { points: remainingPoints })}
      </p>
    </div>
  );
};

export default TachometerMilestoneBar;
