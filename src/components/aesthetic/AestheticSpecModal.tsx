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
  'ui-btn inline-flex h-9 w-full items-center justify-center gap-1.5 border border-zinc-500/40 bg-zinc-950/50 px-3 text-xs text-zinc-300 hover:text-white disabled:pointer-events-none disabled:opacity-40';

/** Dark-gold primary — full-bleed under the plaque so Share is the first read. */
const SHARE_BTN_CLASS =
  'ui-btn inline-flex h-9 w-full items-center justify-center gap-1.5 border border-amber-400/60 bg-amber-500/15 px-3 text-xs font-medium text-amber-200 hover:border-amber-300/80 hover:bg-amber-500/25 hover:text-amber-100 disabled:pointer-events-none disabled:opacity-40';

/**
 * WHY: Do not use `.ui-btn` here — its border/bg bleed would fight the quiet text-only
 * dismiss affordance and compete with Share / capture chips.
 */
const CLOSE_BTN_CLASS =
  'h-7 px-3 text-xs text-zinc-400 transition hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-40';

const IconCamera: FC = () => (
  <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4.5 8.25h2.1l1.05-1.8h6.7l1.05 1.8h2.1A1.75 1.75 0 0 1 19.25 10v7.25A1.75 1.75 0 0 1 17.5 19H6.5A1.75 1.75 0 0 1 4.75 17.25V10A1.75 1.75 0 0 1 6.5 8.25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13.25" r="2.75" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconAlbum: FC = () => (
  <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="3.75"
      y="5.75"
      width="16.5"
      height="12.5"
      rx="1.75"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="m7.5 14.5 2.4-2.4a1 1 0 0 1 1.35 0L14 14.85l1.15-1.15a1 1 0 0 1 1.35 0L18 15.2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="9.25" r="1.1" fill="currentColor" />
  </svg>
);

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
      className={`group fixed inset-0 ${Z_INDEX_CLASS.toolResultModal} flex h-dvh flex-col items-center justify-center overflow-hidden ui-modal-safe-shell pb-0`}
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

          {/*
            WHY: Shell uses pb-0 so only `.ui-modal-safe-footer` owns bottom inset —
            avoids double safe-area that would blow the 10.5rem stage reserve.
            Three equal-width layers — no flex-wrap so carbon/selfie chips stay symmetric.
          */}
          <div className="flex w-full flex-col gap-1.5">
            <button
              type="button"
              data-testid="aesthetic-share-report"
              className={SHARE_BTN_CLASS}
              disabled={busy}
              onClick={() => {
                void shareReport();
              }}
            >
              {busy ? t('aesthetic.share.sharing') : t('aesthetic.share.shareReport')}
            </button>
            <div
              data-testid="aesthetic-tool-row"
              className={`grid w-full gap-2 ${mode === 'selfie' ? 'grid-cols-3' : 'grid-cols-2'}`}
            >
              <button
                type="button"
                data-testid="aesthetic-selfie-camera"
                className={ACTION_BTN_CLASS}
                disabled={busy}
                onClick={() => {
                  void captureBackground('camera');
                }}
              >
                <IconCamera />
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
                <IconAlbum />
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
            </div>
            <div className="flex w-full items-center justify-center">
              <button
                type="button"
                data-testid="aesthetic-close-modal"
                className={CLOSE_BTN_CLASS}
                onClick={onCloseClick}
              >
                {t('aesthetic.labels.closeModal')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AestheticSpecModal;
