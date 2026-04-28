import { type FC, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

export interface LeaderboardGateSheetProps {
  open: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}

/**
 * Mobile-first access gate sheet for auth/pro blockers.
 * Keeps copy short, clear, and action-oriented.
 */
const LeaderboardGateSheet: FC<LeaderboardGateSheetProps> = ({
  open,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSecondary();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onSecondary]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex flex-col justify-end pt-4 pb-[calc(64px+env(safe-area-inset-bottom,0px))] sm:items-center sm:justify-center sm:px-4 sm:pt-4 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px))]"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label={secondaryLabel}
        onClick={onSecondary}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-700 bg-bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-panel sm:rounded-2xl sm:pb-6"
      >
        <h2 id={titleId} className="text-base font-semibold tracking-tight text-zinc-50">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{description}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="min-h-11 rounded-xl border border-zinc-600 bg-transparent px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800/80"
            onClick={onSecondary}
          >
            {secondaryLabel}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl border border-accent-primary bg-accent-primary px-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,140,0,0.28)] hover:bg-orange-400"
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
};

export default LeaderboardGateSheet;
