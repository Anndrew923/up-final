import { useEffect, useId, useRef, type FC, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useAestheticCertReveal } from '../../hooks/useAestheticCertReveal';
import { useAestheticSpecCard } from '../../hooks/useAestheticSpecCard';
import { useAestheticTelemetryShare } from '../../hooks/useAestheticTelemetryShare';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import {
  CERT_FOOTER_WRAP_CLASS,
  CERT_STAGE_MAX_H_CLASS,
  CERT_STAGE_WRAP_CLASS,
} from './aestheticChrome';
import { CERT_VEIL_REVEAL_CLASS } from '../../lib/certRevealMotion';
import AestheticSpecCard from './AestheticSpecCard';

export interface AestheticSpecModalProps {
  onClose: () => void;
}

const ACTION_BTN_CLASS =
  'ui-btn border border-zinc-500/40 bg-zinc-950/50 px-3 py-1.5 text-xs text-zinc-300 hover:text-white disabled:pointer-events-none disabled:opacity-40';

const AestheticSpecModal: FC<AestheticSpecModalProps> = ({ onClose }) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const model = useAestheticSpecCard();
  const { phase, skip } = useAestheticCertReveal();
  const {
    mode,
    previewUrl,
    busy,
    errorMessage,
    captureBackground,
    resetToCarbon,
    shareReport,
  } = useAestheticTelemetryShare(model);
  useFocusTrap(dialogRef, true);
  useShellScrollLock(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const onBackdropClick = () => {
    if (phase === 'revealing') {
      skip();
      return;
    }
    // WHY: Allow dismiss even while compose/share is busy — unmount releases bitmap/URL.
    onClose();
  };

  const onDialogClick = () => {
    if (phase === 'revealing') skip();
  };

  const onCloseClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClose();
  };

  const stopRowClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  if (typeof document === 'undefined') return null;

  const showSelfiePreview = mode === 'selfie' && Boolean(previewUrl);

  return createPortal(
    <div
      className={`group fixed inset-0 ${Z_INDEX_CLASS.toolResultModal} flex h-dvh flex-col items-center justify-center overflow-hidden ui-modal-safe-shell`}
      data-cert-phase={phase}
      data-telemetry-mode={mode}
      role="presentation"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm ${CERT_VEIL_REVEAL_CLASS}`}
        aria-label={t('aesthetic.labels.closeAria')}
        onClick={onBackdropClick}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={phase === 'revealing' || busy}
        className="relative z-10 flex min-h-0 w-full flex-col items-center"
        onClick={onDialogClick}
      >
        <h2 id={titleId} className="sr-only">
          {t('aesthetic.labels.triggerCta')}
        </h2>
        <div className={CERT_STAGE_WRAP_CLASS}>
          {showSelfiePreview ? (
            <img
              data-testid="aesthetic-telemetry-preview"
              src={previewUrl ?? undefined}
              alt={t('aesthetic.share.previewAlt')}
              className={`aspect-[9/16] w-full origin-center ${CERT_STAGE_MAX_H_CLASS} rounded-2xl border border-[#c9a227]/30 object-contain shadow-[0_16px_40px_rgba(0,0,0,0.55)]`}
            />
          ) : (
            <AestheticSpecCard model={model} />
          )}
        </div>

        <div
          className={`ui-modal-safe-footer ${CERT_FOOTER_WRAP_CLASS}`}
          onClick={stopRowClick}
        >
          {errorMessage ? (
            <p
              data-testid="aesthetic-telemetry-error"
              className="w-full text-center text-[11px] leading-snug text-amber-200/90"
              role="status"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              data-testid="aesthetic-share-report"
              className={ACTION_BTN_CLASS}
              disabled={busy}
              onClick={() => {
                void shareReport();
              }}
            >
              {busy ? t('aesthetic.share.sharing') : t('aesthetic.share.shareReport')}
            </button>
            <button
              type="button"
              data-testid="aesthetic-selfie-camera"
              className={ACTION_BTN_CLASS}
              disabled={busy}
              onClick={() => {
                void captureBackground('camera');
              }}
            >
              {t('aesthetic.share.cameraBg')}
            </button>
            <button
              type="button"
              data-testid="aesthetic-selfie-photos"
              className={ACTION_BTN_CLASS}
              disabled={busy}
              onClick={() => {
                void captureBackground('photos');
              }}
            >
              {t('aesthetic.share.photosBg')}
            </button>
            {mode === 'selfie' ? (
              <button
                type="button"
                data-testid="aesthetic-restore-carbon"
                className={ACTION_BTN_CLASS}
                disabled={busy}
                onClick={resetToCarbon}
              >
                {t('aesthetic.share.restoreCarbon')}
              </button>
            ) : null}
            <button type="button" className={ACTION_BTN_CLASS} onClick={onCloseClick}>
              {t('aesthetic.labels.closeModal')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AestheticSpecModal;
