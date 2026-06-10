import { App } from '@capacitor/app';
import { useEffect, useId, useRef, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import { isCapacitorNativePlatform } from '../../lib/capacitorPlatform';

export interface ExitConfirmModalProps {
  open: boolean;
  onClose: () => void;
}

const ExitConfirmModal: FC<ExitConfirmModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(dialogRef, open);

  useShellScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && stayButtonRef.current) {
      stayButtonRef.current.focus({ preventScroll: true });
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const handleStay = () => {
    onClose();
  };

  const handleExit = () => {
    onClose();
    if (isCapacitorNativePlatform()) {
      void App.exitApp();
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.exitConfirmModal} flex items-center justify-center px-4`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/88 backdrop-blur-md"
        aria-label={t('stayInApp')}
        onClick={handleStay}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-sm motion-reduce:animate-none animate-breakthrough-enter will-change-[transform,opacity]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="relative overflow-hidden rounded-xl border border-cyan-400/40 bg-zinc-950/95 p-6 shadow-[0_0_40px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(52,211,153,0.25)]"
          style={{ ['--aura-neon-rgb' as string]: '52 211 153' }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10"
            aria-hidden
          />

          <header className="relative space-y-2 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
              {t('exitModalKicker')}
            </p>
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-zinc-50">
              {t('exitModalTitle')}
            </h2>
          </header>

          <p id={descId} className="relative mt-4 text-center text-sm leading-relaxed text-zinc-300">
            {t('exitModalMessage')}
          </p>

          <div className="relative mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              ref={stayButtonRef}
              className="ui-btn min-w-0 flex-1 border border-zinc-700/90 bg-zinc-900/90 text-zinc-200 hover:border-cyan-500/40 hover:text-cyan-100"
              onClick={handleStay}
            >
              {t('stayInApp')}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-primary min-w-0 flex-1 border border-emerald-400/50 bg-gradient-to-r from-emerald-600/90 to-cyan-600/80 text-zinc-950 hover:from-emerald-500 hover:to-cyan-500"
              onClick={handleExit}
            >
              {t('exitApp')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExitConfirmModal;
