import { useEffect, type FC } from 'react';
import { createPortal } from 'react-dom';

export type DiagnosticAccent =
  | 'strength'
  | 'grip'
  | 'cardio'
  | 'muscle'
  | 'ffmi'
  | 'explosive'
  | 'armSize';

export interface DiagnosticOverlayProps {
  open: boolean;
  statusLine: string;
  scanningLabel: string;
  accent: DiagnosticAccent;
  ariaLabel: string;
}

const ACCENT_STYLES: Record<
  DiagnosticAccent,
  { beam: string; grid: string; bracket: string; text: string; glow: string }
> = {
  strength: {
    beam: 'from-transparent via-accent-primary/55 to-transparent',
    grid: 'bg-[linear-gradient(rgba(255,140,0,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,140,0,0.14)_1px,transparent_1px)]',
    bracket: 'border-accent-primary/70 shadow-[0_0_18px_rgba(255,140,0,0.35)]',
    text: 'text-accent-primary',
    glow: 'bg-accent-primary/10',
  },
  grip: {
    beam: 'from-transparent via-accent-info/55 to-transparent',
    grid: 'bg-[linear-gradient(rgba(0,191,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(0,191,255,0.14)_1px,transparent_1px)]',
    bracket: 'border-accent-info/70 shadow-[0_0_18px_rgba(0,191,255,0.35)]',
    text: 'text-accent-info',
    glow: 'bg-accent-info/10',
  },
  cardio: {
    beam: 'from-transparent via-cyan-400/55 to-transparent',
    grid: 'bg-[linear-gradient(rgba(34,211,238,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.14)_1px,transparent_1px)]',
    bracket: 'border-cyan-400/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]',
    text: 'text-cyan-300',
    glow: 'bg-cyan-500/10',
  },
  muscle: {
    beam: 'from-transparent via-orange-400/55 to-transparent',
    grid: 'bg-[linear-gradient(rgba(251,146,60,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(251,146,60,0.14)_1px,transparent_1px)]',
    bracket: 'border-orange-400/70 shadow-[0_0_18px_rgba(251,146,60,0.35)]',
    text: 'text-orange-300',
    glow: 'bg-orange-500/10',
  },
  ffmi: {
    beam: 'from-transparent via-violet-400/55 to-transparent',
    grid: 'bg-[linear-gradient(rgba(167,139,250,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.14)_1px,transparent_1px)]',
    bracket: 'border-violet-400/70 shadow-[0_0_18px_rgba(139,92,246,0.35)]',
    text: 'text-violet-300',
    glow: 'bg-violet-500/10',
  },
  explosive: {
    beam: 'from-transparent via-amber-400/55 to-transparent',
    grid: 'bg-[linear-gradient(rgba(251,191,36,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.14)_1px,transparent_1px)]',
    bracket: 'border-amber-400/70 shadow-[0_0_18px_rgba(245,158,11,0.35)]',
    text: 'text-amber-300',
    glow: 'bg-amber-500/10',
  },
  armSize: {
    beam: 'from-transparent via-zinc-400/55 to-transparent',
    grid: 'bg-[linear-gradient(rgba(161,161,170,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(161,161,170,0.14)_1px,transparent_1px)]',
    bracket: 'border-zinc-400/70 shadow-[0_0_18px_rgba(113,113,122,0.35)]',
    text: 'text-zinc-300',
    glow: 'bg-zinc-500/10',
  },
};

/**
 * Full-viewport diagnostic scan veil — transform/opacity only for compositor-friendly 60fps motion.
 */
const DiagnosticOverlay: FC<DiagnosticOverlayProps> = ({
  open,
  statusLine,
  scanningLabel,
  accent,
  ariaLabel,
}) => {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const styles = ACCENT_STYLES[accent];
  const rotatingLine = statusLine.trim().length > 0 ? statusLine : scanningLabel;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className="pointer-events-auto absolute inset-0 bg-bg-base/88 backdrop-blur-md" />

      <div
        className={`pointer-events-none absolute inset-0 opacity-40 ${styles.glow}`}
        aria-hidden
      />

      <div
        className={`pointer-events-none absolute inset-0 bg-[length:28px_28px] motion-reduce:animate-none ${styles.grid} animate-diagnostic-grid-breathe will-change-[transform,opacity]`}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[38%] overflow-hidden motion-reduce:hidden"
        aria-hidden
      >
        <div
          className={`h-24 w-full bg-gradient-to-b ${styles.beam} animate-diagnostic-scan will-change-transform`}
        />
      </div>

      <div className="pointer-events-none absolute inset-6 sm:inset-10" aria-hidden>
        <span className={`absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 ${styles.bracket}`} />
        <span className={`absolute right-0 top-0 h-10 w-10 border-r-2 border-t-2 ${styles.bracket}`} />
        <span
          className={`absolute bottom-0 left-0 h-10 w-10 border-b-2 border-l-2 ${styles.bracket}`}
        />
        <span
          className={`absolute bottom-0 right-0 h-10 w-10 border-b-2 border-r-2 ${styles.bracket}`}
        />
      </div>

      <div className="relative z-[1] mx-auto max-w-md px-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-500">
          {scanningLabel}
        </p>
        <p
          key={rotatingLine}
          aria-live="polite"
          className={`mt-4 text-sm font-medium leading-relaxed motion-reduce:transition-none ${styles.text} transition-opacity duration-300 ease-out will-change-opacity`}
        >
          {rotatingLine}
        </p>
      </div>
    </div>,
    document.body
  );
};

export default DiagnosticOverlay;
