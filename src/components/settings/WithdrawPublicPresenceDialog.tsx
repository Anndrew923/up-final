import { type FC, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';

export interface WithdrawPublicPresenceDialogProps {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  /** Wipe public ladder footprints (shards + preview). Club roster untouched. */
  onWithdraw: () => void;
}

/**
 * Settings confirm for erasing global public ladder footprint.
 * WHY: Intent lives on sync CTAs; Settings only manages historical public residue.
 */
const WithdrawPublicPresenceDialog: FC<WithdrawPublicPresenceDialogProps> = ({
  open,
  busy = false,
  onCancel,
  onWithdraw,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(dialogRef, open);
  useShellScrollLock(open);

  useEffect(() => {
    if (!open) return;
    cancelButtonRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.dynoIntelClearHistoryDialog} flex items-center justify-center px-4 ui-modal-safe-shell`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        aria-label={t('settings.withdrawPublic.cancel')}
        disabled={busy}
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-400/25 bg-zinc-950/95 p-6 shadow-[0_0_42px_rgba(34,211,238,0.12)] motion-reduce:animate-none animate-breakthrough-enter"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
          aria-hidden
        />
        <header className="relative space-y-2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/75">
            {t('settings.withdrawPublic.kicker')}
          </p>
          <h2 id={titleId} className="text-lg font-bold tracking-tight text-zinc-50">
            {t('settings.withdrawPublic.eraseOnlyTitle')}
          </h2>
        </header>
        <p
          id={descriptionId}
          className="relative mt-4 text-center text-sm leading-relaxed text-zinc-300"
        >
          {t('settings.withdrawPublic.eraseOnlyBody')}
        </p>
        <div className="relative mt-6 flex flex-col gap-2">
          <button
            type="button"
            className="w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm font-semibold text-rose-200 disabled:opacity-40"
            disabled={busy}
            onClick={onWithdraw}
          >
            {busy
              ? t('settings.withdrawPublic.withdrawing')
              : t('settings.withdrawPublic.eraseHistoryCta')}
          </button>
          <button
            ref={cancelButtonRef}
            type="button"
            className="w-full py-2 text-xs font-medium tracking-wide text-zinc-500 hover:text-zinc-300 disabled:opacity-40"
            disabled={busy}
            onClick={onCancel}
          >
            {t('settings.withdrawPublic.cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WithdrawPublicPresenceDialog;
