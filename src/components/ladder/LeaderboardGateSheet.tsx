import { type FC, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { usePrefersReducedMotion } from '../../lib/motionPreference';

import type { GateSheetKind } from '../../types/uiGate';

export type LeaderboardGateSheetKind = GateSheetKind;

export interface LeaderboardGateSheetProps {
  open: boolean;
  kind: LeaderboardGateSheetKind;
  /** Contextual body copy — titles and primary CTA are locked per kind. */
  description: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}

/**
 * Mobile-first access gate sheet — auth (minimal gray) vs pro (arena shimmer) are visually decoupled.
 */
const LeaderboardGateSheet: FC<LeaderboardGateSheetProps> = ({
  open,
  kind,
  description,
  secondaryLabel,
  onPrimary,
  onSecondary,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const ctaMotionOn = !usePrefersReducedMotion();
  const isPro = kind === 'pro';

  const title = t(`gateSheet.${kind}.title`);
  const primaryLabel = t(`gateSheet.${kind}.primary`);

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
        className={`relative z-10 w-full max-w-md rounded-t-2xl border px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-panel sm:rounded-2xl sm:pb-6 ${
          isPro
            ? 'border-accent-primary/35 bg-bg-card'
            : 'border-zinc-600/80 bg-zinc-950/95'
        }`}
      >
        <h2
          id={titleId}
          className={`text-base font-semibold tracking-tight ${
            isPro ? 'text-zinc-50' : 'text-zinc-200'
          }`}
        >
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
            className={`group relative min-h-11 overflow-hidden rounded-xl border px-3 text-sm font-semibold ${
              isPro
                ? 'border-accent-primary/80 text-black shadow-[0_0_20px_rgba(255,140,0,0.28)] hover:bg-orange-400'
                : 'border-zinc-500 bg-zinc-800 text-zinc-100 hover:border-zinc-400 hover:bg-zinc-700'
            }`}
            onClick={onPrimary}
          >
            {isPro ? (
              <>
                <span
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-accent-primary via-amber-300 to-orange-500 bg-[length:200%_200%] ${
                    ctaMotionOn ? 'animate-arena-cta-shimmer' : ''
                  }`}
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)] opacity-60"
                  aria-hidden
                />
              </>
            ) : null}
            <span className="relative z-[1]">{primaryLabel}</span>
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
};

export default LeaderboardGateSheet;
