import { useEffect, useId, useRef, type FC, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useAestheticCertReveal } from '../../hooks/useAestheticCertReveal';
import { useAestheticSpecCard } from '../../hooks/useAestheticSpecCard';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import { CERT_STAGE_WRAP_CLASS } from './aestheticChrome';
import { CERT_VEIL_REVEAL_CLASS } from '../../lib/certRevealMotion';
import AestheticSpecCard from './AestheticSpecCard';

export interface AestheticSpecModalProps {
  onClose: () => void;
}

const AestheticSpecModal: FC<AestheticSpecModalProps> = ({ onClose }) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const model = useAestheticSpecCard();
  const { phase, skip } = useAestheticCertReveal();
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
    onClose();
  };

  const onDialogClick = () => {
    if (phase === 'revealing') skip();
  };

  const onCloseClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`group fixed inset-0 ${Z_INDEX_CLASS.toolResultModal} flex h-dvh flex-col items-center justify-center overflow-hidden ui-modal-safe-shell`}
      data-cert-phase={phase}
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
        aria-busy={phase === 'revealing'}
        className="relative z-10 flex min-h-0 w-full flex-col items-center"
        onClick={onDialogClick}
      >
        <h2 id={titleId} className="sr-only">
          {t('aesthetic.labels.triggerCta')}
        </h2>
        <div className={CERT_STAGE_WRAP_CLASS}>
          <AestheticSpecCard model={model} />
        </div>
        <div className="mt-4 shrink-0">
          <button
            type="button"
            className="ui-btn border border-zinc-500/40 bg-zinc-950/50 px-4 py-1.5 text-xs text-zinc-300 hover:text-white"
            onClick={onCloseClick}
          >
            {t('aesthetic.labels.closeModal')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AestheticSpecModal;
