import { type FC, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';

export interface DynoIntelClearHistoryDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DynoIntelClearHistoryDialog: FC<DynoIntelClearHistoryDialogProps> = ({
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
      className={`fixed inset-0 ${Z_INDEX_CLASS.dynoIntelClearHistoryDialog} flex items-center justify-center px-4`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        aria-label={t('dynoIntel.telemetryLog.clearCancel')}
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-red-400/30 bg-zinc-950/95 p-6 shadow-[0_0_42px_rgba(248,113,113,0.14)] motion-reduce:animate-none animate-breakthrough-enter"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent"
          aria-hidden
        />
        <header className="relative space-y-2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-300/75">
            {t('dynoIntel.telemetryLog.clearKicker')}
          </p>
          <h2 id={titleId} className="text-lg font-bold tracking-tight text-zinc-50">
            {t('dynoIntel.telemetryLog.clearTitle')}
          </h2>
        </header>
        <p
          id={descriptionId}
          className="relative mt-4 text-center text-sm leading-relaxed text-zinc-300"
        >
          {t('dynoIntel.telemetryLog.clearDescription')}
        </p>
        <div className="relative mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            ref={cancelButtonRef}
            type="button"
            className="ui-btn min-w-0 flex-1 border border-zinc-700/90 bg-zinc-900/90 text-zinc-200 hover:border-cyan-500/40 hover:text-cyan-100"
            onClick={onCancel}
          >
            {t('dynoIntel.telemetryLog.clearCancel')}
          </button>
          <button
            type="button"
            className="ui-btn min-w-0 flex-1 border border-red-400/45 bg-red-950/55 text-red-100 hover:bg-red-900/65"
            onClick={onConfirm}
          >
            {t('dynoIntel.telemetryLog.clearConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DynoIntelClearHistoryDialog;
