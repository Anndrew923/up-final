import { useEffect, useId, useRef, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';

export type TermsLegalModalMode = 'preview' | 'gate';

export interface TermsLegalModalProps {
  open: boolean;
  mode: TermsLegalModalMode;
  onClose?: () => void;
  onAccept?: () => void;
  accepting?: boolean;
}

/**
 * Combined Terms of Service + Health disclaimer.
 * - `preview`: dismissible (Auth choice link)
 * - `gate`: must Accept — Escape / backdrop do not dismiss
 */
export const TermsLegalModal: FC<TermsLegalModalProps> = ({
  open,
  mode,
  onClose,
  onAccept,
  accepting = false,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const isGate = mode === 'gate';

  useFocusTrap(dialogRef, open);
  useShellScrollLock(open);

  useEffect(() => {
    if (!open || isGate) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, isGate, onClose]);

  useEffect(() => {
    if (open && primaryRef.current) {
      primaryRef.current.focus({ preventScroll: true });
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.termsGateModal} flex items-end justify-center ui-modal-safe-shell sm:items-center`}
      role="presentation"
    >
      {isGate ? (
        // WHY: Gate must not look like a dismissible control — inert scrim only.
        <div className="absolute inset-0 bg-black/88 backdrop-blur-md" aria-hidden />
      ) : (
        <button
          type="button"
          className="absolute inset-0 bg-black/88 backdrop-blur-md"
          aria-label={t('legal.closePreview')}
          onClick={() => onClose?.()}
        />
      )}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 flex max-h-[min(88dvh,40rem)] w-full max-w-lg flex-col motion-reduce:animate-none animate-breakthrough-enter will-change-[transform,opacity] sm:mx-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-2xl border border-cyan-400/35 bg-zinc-950/95 shadow-[0_0_40px_rgba(34,211,238,0.16)] sm:rounded-2xl">
          <header className="shrink-0 space-y-1.5 border-b border-zinc-800/90 px-5 pb-3 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
              {t('legal.modalKicker')}
            </p>
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-zinc-50">
              {isGate ? t('legal.gateTitle') : t('legal.modalTitle')}
            </h2>
            {isGate ? (
              <p id={descId} className="text-sm leading-relaxed text-zinc-400">
                {t('legal.gateIntro')}
              </p>
            ) : (
              <p id={descId} className="sr-only">
                {t('legal.modalTitle')}
              </p>
            )}
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 text-sm leading-relaxed text-zinc-300">
            <section className="space-y-1.5">
              <h3 className="font-semibold text-zinc-100">{t('legal.sectionMedicalTitle')}</h3>
              <p>{t('legal.sectionMedicalBody')}</p>
            </section>
            <section className="space-y-1.5">
              <h3 className="font-semibold text-zinc-100">{t('legal.sectionRiskTitle')}</h3>
              <p>{t('legal.sectionRiskBody')}</p>
            </section>
            <section className="space-y-1.5">
              <h3 className="font-semibold text-zinc-100">{t('legal.sectionServiceTitle')}</h3>
              <p>{t('legal.sectionServiceBody')}</p>
            </section>
          </div>

          <div className="ui-modal-safe-footer shrink-0 border-t border-zinc-800 px-5 pt-3">
            {isGate ? (
              <button
                type="button"
                ref={primaryRef}
                className="ui-btn ui-btn-primary w-full justify-center"
                disabled={accepting}
                onClick={() => onAccept?.()}
              >
                {t('legal.acceptContinue')}
              </button>
            ) : (
              <button
                type="button"
                ref={primaryRef}
                className="ui-btn w-full justify-center"
                onClick={() => onClose?.()}
              >
                {t('legal.closePreview')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TermsLegalModal;
