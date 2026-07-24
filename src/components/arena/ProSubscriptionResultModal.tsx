import { useEffect, useId, useRef, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';

export type ProSubscriptionResultKind = 'success' | 'failure';
export type ProSubscriptionFailureReason = 'billing' | 'auth' | 'core';

export interface ProSubscriptionResultModalProps {
  open: boolean;
  kind: ProSubscriptionResultKind;
  /** Optional failure detail — defaults to billing channel offline copy. */
  failureReason?: ProSubscriptionFailureReason;
  onRetry?: () => void;
  onBrowse?: () => void;
  onSuccessContinue?: () => void;
}

function failureCopyKeys(reason: ProSubscriptionFailureReason): {
  kicker: string;
  title: string;
  body: string;
} {
  if (reason === 'auth') {
    return {
      kicker: 'subscriptionResult.failKicker',
      title: 'subscriptionResult.failTitle',
      body: 'subscriptionResult.authFailBody',
    };
  }
  if (reason === 'core') {
    return {
      kicker: 'subscriptionResult.coreFailKicker',
      title: 'subscriptionResult.coreFailTitle',
      body: 'subscriptionResult.coreFailBody',
    };
  }
  return {
    kicker: 'subscriptionResult.failKicker',
    title: 'subscriptionResult.failTitle',
    body: 'subscriptionResult.failBody',
  };
}

/**
 * Full-screen Pro subscription ceremony — replaces inline rose/emerald banner boxes.
 * Failure: neon warning halo + retry / browse. Success: gold medal ritual.
 */
const ProSubscriptionResultModal: FC<ProSubscriptionResultModalProps> = ({
  open,
  kind,
  failureReason = 'billing',
  onRetry,
  onBrowse,
  onSuccessContinue,
}) => {
  const { t } = useTranslation('arena');
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(dialogRef, open);
  useShellScrollLock(open);

  const showRetry = kind === 'failure' && failureReason !== 'core';

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (kind === 'success') {
        onSuccessContinue?.();
      } else {
        onBrowse?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, kind, onBrowse, onSuccessContinue]);

  useEffect(() => {
    if (open && primaryRef.current) {
      primaryRef.current.focus({ preventScroll: true });
    }
  }, [open, kind, failureReason]);

  if (!open || typeof document === 'undefined') return null;

  const isSuccess = kind === 'success';
  const failKeys = failureCopyKeys(failureReason);

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.proSubscriptionResultModal} flex items-center justify-center ui-modal-safe-shell`}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" aria-hidden />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {isSuccess ? (
          <>
            <div className="absolute left-1/2 top-[28%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/25 blur-[100px]" />
            <div className="absolute bottom-[20%] left-1/3 h-40 w-40 rounded-full bg-orange-500/20 blur-[70px]" />
          </>
        ) : (
          <>
            <div className="absolute left-1/2 top-[30%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/30 blur-[100px]" />
            <div className="absolute bottom-[22%] right-1/4 h-44 w-44 rounded-full bg-fuchsia-500/20 blur-[80px]" />
          </>
        )}
      </div>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-md motion-reduce:animate-none animate-breakthrough-enter will-change-[transform,opacity]"
      >
        <div
          className={
            isSuccess
              ? 'relative overflow-hidden rounded-2xl border border-amber-400/55 bg-zinc-950/95 p-7 shadow-[0_0_56px_rgba(251,191,36,0.35),inset_0_1px_0_rgba(251,191,36,0.25)]'
              : 'relative overflow-hidden rounded-2xl border border-rose-400/50 bg-zinc-950/95 p-7 shadow-[0_0_56px_rgba(244,63,94,0.4),0_0_120px_rgba(244,63,94,0.18),inset_0_1px_0_rgba(251,113,133,0.25)]'
          }
        >
          <div
            className={
              isSuccess
                ? 'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/90 to-transparent'
                : 'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/90 to-transparent'
            }
            aria-hidden
          />

          {isSuccess ? (
            <div className="relative mb-5 flex justify-center" aria-hidden>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-300/70 bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 shadow-[0_0_36px_rgba(251,191,36,0.55)]">
                <span className="absolute -inset-2 rounded-full border border-amber-400/30" />
                <span className="h-3 w-3 rotate-45 rounded-[2px] bg-zinc-950/90" />
              </div>
            </div>
          ) : (
            <div className="relative mb-5 flex justify-center" aria-hidden>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-rose-400/60 bg-rose-500/15 shadow-[0_0_28px_rgba(244,63,94,0.45)]">
                <span className="absolute top-[28%] h-5 w-[3px] rounded-full bg-rose-200" />
                <span className="absolute bottom-[26%] h-[3px] w-[3px] rounded-full bg-rose-200" />
              </div>
            </div>
          )}

          <header className="relative space-y-2 text-center">
            <p
              className={
                isSuccess
                  ? 'font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/90'
                  : 'font-mono text-[10px] uppercase tracking-[0.32em] text-rose-300/90'
              }
            >
              {isSuccess ? t('subscriptionResult.successKicker') : t(failKeys.kicker)}
            </p>
            <h2
              id={titleId}
              className="text-pretty text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl"
            >
              {isSuccess ? t('subscriptionResult.successTitle') : t(failKeys.title)}
            </h2>
          </header>

          <p
            id={descId}
            className="relative mt-4 text-pretty text-center text-sm leading-relaxed text-zinc-300"
          >
            {isSuccess ? t('subscriptionResult.successBody') : t(failKeys.body)}
          </p>

          <div className="relative mt-6 flex flex-col gap-2.5">
            {isSuccess ? (
              <button
                type="button"
                ref={primaryRef}
                className="w-full rounded-xl border border-amber-400/60 bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-[0_0_28px_rgba(251,191,36,0.4)] transition hover:shadow-[0_0_40px_rgba(251,191,36,0.55)]"
                onClick={() => onSuccessContinue?.()}
              >
                {t('subscriptionResult.successCta')}
              </button>
            ) : (
              <>
                {showRetry ? (
                  <button
                    type="button"
                    ref={primaryRef}
                    className="w-full rounded-xl border border-rose-400/55 bg-gradient-to-r from-rose-600/90 to-fuchsia-600/80 px-6 py-3.5 text-sm font-bold text-zinc-50 shadow-[0_0_28px_rgba(244,63,94,0.35)] transition hover:from-rose-500 hover:to-fuchsia-500"
                    onClick={() => onRetry?.()}
                  >
                    {t('subscriptionResult.retryCta')}
                  </button>
                ) : null}
                <button
                  type="button"
                  ref={showRetry ? null : primaryRef}
                  className="w-full rounded-xl border border-zinc-700/90 bg-zinc-900/90 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-zinc-50"
                  onClick={() => onBrowse?.()}
                >
                  {t('subscriptionResult.browseCta')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProSubscriptionResultModal;
