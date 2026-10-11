import { type FC, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';

export interface CloudSyncRestoreConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Destructive restore confirm — mirrors Dyno clear-history dialog affordances. */
const CloudSyncRestoreConfirmDialog: FC<CloudSyncRestoreConfirmDialogProps> = ({
  open,
  onCancel,
  onConfirm,
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
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.toolResultModal} flex items-center justify-center ui-modal-safe-shell px-4`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        aria-label={t('tools.sync.restoreConfirmCancel')}
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-amber-400/30 bg-zinc-950/95 p-6 shadow-[0_0_42px_rgba(251,191,36,0.12)] motion-reduce:animate-none animate-breakthrough-enter"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent"
          aria-hidden
        />
        <header className="relative space-y-2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300/75">
            {t('tools.sync.restoreConfirmKicker')}
          </p>
          <h2 id={titleId} className="text-lg font-bold tracking-tight text-zinc-50">
            {t('tools.sync.restoreConfirmTitle')}
          </h2>
        </header>
        <p
          id={descriptionId}
          className="relative mt-4 text-center text-sm leading-relaxed text-zinc-300"
        >
          {t('tools.sync.restoreConfirmBody')}
        </p>
        <div className="relative mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            ref={cancelButtonRef}
            type="button"
            className="ui-btn min-w-0 flex-1 border border-zinc-700/90 bg-zinc-900/90 text-zinc-200 hover:border-zinc-500"
            onClick={onCancel}
          >
            {t('tools.sync.restoreConfirmCancel')}
          </button>
          <button
            type="button"
            className="ui-btn min-w-0 flex-1 border border-amber-400/45 bg-amber-950/55 text-amber-100 hover:bg-amber-900/65"
            onClick={onConfirm}
          >
            {t('tools.sync.restoreConfirmAction')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CloudSyncRestoreConfirmDialog;
