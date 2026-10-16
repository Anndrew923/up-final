import { type FC, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';

export type WithdrawPublicPresenceDialogMode = 'opt-out' | 'erase-only';

export interface WithdrawPublicPresenceDialogProps {
  open: boolean;
  busy?: boolean;
  mode?: WithdrawPublicPresenceDialogMode;
  onCancel: () => void;
  /** Turn off global publish preference only — keep historical public entries. */
  onPreferOffOnly?: () => void;
  /** Wipe public ladder footprints (and turn preference off when mode=opt-out). */
  onWithdraw: () => void;
}

/**
 * Settings confirm for privacy opt-out and/or public footprint erase.
 * WHY: Privacy promise needs an explicit wipe path without forcing it on every opt-out.
 */
const WithdrawPublicPresenceDialog: FC<WithdrawPublicPresenceDialogProps> = ({
  open,
  busy = false,
  mode = 'opt-out',
  onCancel,
  onPreferOffOnly,
  onWithdraw,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const eraseOnly = mode === 'erase-only';

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
            {eraseOnly
              ? t('settings.withdrawPublic.eraseOnlyTitle')
              : t('settings.withdrawPublic.title')}
          </h2>
        </header>
        <p
          id={descriptionId}
          className="relative mt-4 text-center text-sm leading-relaxed text-zinc-300"
        >
          {eraseOnly
            ? t('settings.withdrawPublic.eraseOnlyBody')
            : t('settings.withdrawPublic.body')}
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
              : eraseOnly
                ? t('settings.withdrawPublic.eraseHistoryCta')
                : t('settings.withdrawPublic.withdrawAndOff')}
          </button>
          {!eraseOnly && onPreferOffOnly ? (
            <button
              type="button"
              className="w-full rounded-xl border border-zinc-600 px-3 py-2.5 text-sm font-semibold text-zinc-200 disabled:opacity-40"
              disabled={busy}
              onClick={onPreferOffOnly}
            >
              {t('settings.withdrawPublic.preferOffOnly')}
            </button>
          ) : null}
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
