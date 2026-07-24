import { useCallback, useEffect, useId, useRef, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { MONETIZATION_CONFIG } from '../../config/monetization';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import { dismissLadderGenesisEarlyBird } from '../../services/ladderGenesisPrefService';

export interface LadderGenesisEarlyBirdModalProps {
  open: boolean;
  onEnter: () => void;
}

/**
 * Genesis early-bird announcement — shown when entering the ladder during open access.
 * Enter always suppresses for the session; checkbox persists across sessions.
 */
const LadderGenesisEarlyBirdModal: FC<LadderGenesisEarlyBirdModalProps> = ({ open, onEnter }) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const enterButtonRef = useRef<HTMLButtonElement>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useFocusTrap(dialogRef, open);
  useShellScrollLock(open);

  const handleEnter = useCallback(() => {
    dismissLadderGenesisEarlyBird(dontShowAgain);
    onEnter();
  }, [dontShowAgain, onEnter]);

  useEffect(() => {
    if (!open) {
      setDontShowAgain(false);
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // WHY: Escape still enters ladder — this is an announcement, not a hard gate.
        handleEnter();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, handleEnter]);

  useEffect(() => {
    if (open && enterButtonRef.current) {
      enterButtonRef.current.focus({ preventScroll: true });
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const seatLimit = MONETIZATION_CONFIG.genesisEarlyBirdSeatLimit;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.ladderGenesisModal} flex items-center justify-center ui-modal-safe-shell`}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/88 backdrop-blur-md" aria-hidden />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/20 blur-[90px]" />
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-cyan-400/15 blur-[80px]" />
      </div>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-md motion-reduce:animate-none animate-breakthrough-enter will-change-[transform,opacity]"
      >
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/45 bg-zinc-950/95 p-6 shadow-[0_0_48px_rgba(251,191,36,0.22),inset_0_1px_0_rgba(251,191,36,0.2)]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/12 via-transparent to-cyan-500/10"
            aria-hidden
          />

          <header className="relative space-y-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/85">
              {t('ladder.genesisEarlyBird.kicker')}
            </p>
            <h2
              id={titleId}
              className="text-pretty text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl"
            >
              {t('ladder.genesisEarlyBird.title')}
            </h2>
          </header>

          <p
            id={descId}
            className="relative mt-4 text-pretty text-center text-sm leading-relaxed text-zinc-300"
          >
            {t('ladder.genesisEarlyBird.body', { count: seatLimit })}
          </p>
          <p className="relative mt-2 text-center text-xs leading-relaxed text-zinc-500">
            {t('ladder.genesisEarlyBird.proNote')}
          </p>

          <label className="relative mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800/90 bg-zinc-900/60 px-3.5 py-3">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-950 text-amber-400 focus:ring-amber-400/40"
            />
            <span className="text-sm leading-snug text-zinc-300">
              {t('ladder.genesisEarlyBird.dontShowAgain')}
            </span>
          </label>

          <button
            type="button"
            ref={enterButtonRef}
            className="relative mt-5 w-full rounded-xl border border-amber-400/60 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-[0_0_28px_rgba(251,191,36,0.35)] transition hover:shadow-[0_0_36px_rgba(251,191,36,0.5)]"
            onClick={handleEnter}
          >
            {t('ladder.genesisEarlyBird.enterCta')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LadderGenesisEarlyBirdModal;
