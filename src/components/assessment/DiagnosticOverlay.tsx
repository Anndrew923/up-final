import { useEffect, type FC } from 'react';
import { createPortal } from 'react-dom';
import { ASSESSMENT_LOBBY_SIX_AXIS_MAP } from '../../config/assessmentLobby';
import {
  ARM_SIZE_ACCENT_RGB,
  buildDiagnosticScanAccentStyles,
  getSixAxisAccentRgb,
  type DiagnosticScanAccentStyles,
} from '../../config/sharedAxisAccentTokens';

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

function resolveDiagnosticAccentStyles(accent: DiagnosticAccent): DiagnosticScanAccentStyles {
  if (accent === 'armSize') {
    return buildDiagnosticScanAccentStyles(ARM_SIZE_ACCENT_RGB);
  }
  return buildDiagnosticScanAccentStyles(getSixAxisAccentRgb(ASSESSMENT_LOBBY_SIX_AXIS_MAP[accent]));
}

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

  const styles = resolveDiagnosticAccentStyles(accent);
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
        <span
          className={`absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 ${styles.bracket}`}
        />
        <span
          className={`absolute right-0 top-0 h-10 w-10 border-r-2 border-t-2 ${styles.bracket}`}
        />
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
          style={{ color: styles.textColor }}
          className="mt-4 text-sm font-medium leading-relaxed motion-reduce:transition-none transition-opacity duration-300 ease-out will-change-opacity"
        >
          {rotatingLine}
        </p>
      </div>
    </div>,
    document.body
  );
};

export default DiagnosticOverlay;
