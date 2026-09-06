import { useEffect, useId, useRef, useState, type FC, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { redeemPromoCode, type RedeemPromoCodeReason } from '../../services/promoCodeService';
import { useEntitlementStore } from '../../stores/entitlementStore';
import { useAuthStore } from '../../stores/authStore';

function errorKey(reason: RedeemPromoCodeReason): string {
  switch (reason) {
    case 'auth-required':
      return 'promoCodeErrorAuth';
    case 'invalid':
    case 'unavailable':
      return 'promoCodeErrorInvalid';
    case 'expired':
      return 'promoCodeErrorExpired';
    case 'already-redeemed':
      return 'promoCodeErrorAlready';
    case 'self-redeem':
      return 'promoCodeErrorSelf';
    case 'rate-limited':
      return 'promoCodeErrorRateLimited';
    case 'exhausted':
      return 'promoCodeErrorExhausted';
    default:
      return 'promoCodeErrorGeneric';
  }
}

export interface PromoCodeRedeemPanelProps {
  /** Capsule trigger (Paywall) vs always-expanded inline row (Settings). */
  variant?: 'link' | 'inline';
  className?: string;
  onRedeemed?: () => void;
}

/**
 * Invite / referral redeem UI — presentational; side effects via promoCodeService + entitlement hydrate.
 * WHY: Equal-height (~h-10) capsule ↔ inline form keeps Paywall layout stable when expanding.
 */
const PromoCodeRedeemPanel: FC<PromoCodeRedeemPanelProps> = ({
  variant = 'inline',
  className = '',
  onRedeemed,
}) => {
  const { t } = useTranslation('arena');
  const reactId = useId();
  const panelId = `${reactId}-promo-panel`;
  const toggleId = `${reactId}-promo-toggle`;

  const uid = useAuthStore((s) => s.uid);
  const [expanded, setExpanded] = useState(variant === 'inline');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [successDays, setSuccessDays] = useState<number | null>(null);
  const [errorReason, setErrorReason] = useState<RedeemPromoCodeReason | null>(null);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Skip first paint so Settings inline does not steal focus on mount. */
  const didMountRef = useRef(false);

  const canCollapse = variant === 'link';
  const showForm = variant === 'inline' || expanded;

  const collapse = () => {
    setExpanded(false);
    setCode('');
    setErrorReason(null);
    setSuccessDays(null);
  };

  // WHY: Match DisclosurePanel / modal focus handoff — expand lands in input; collapse returns to capsule.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!canCollapse) return;

    const frame = window.requestAnimationFrame(() => {
      if (showForm) {
        inputRef.current?.focus({ preventScroll: true });
      } else {
        toggleRef.current?.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [canCollapse, showForm]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrorReason(null);
    setSuccessDays(null);
    try {
      const result = await redeemPromoCode(code);
      if (!result.ok) {
        setErrorReason(result.reason);
        return;
      }
      if (!uid) {
        setErrorReason('auth-required');
        return;
      }
      const hydrated = await useEntitlementStore.getState().hydrateServerProFromFirestore(uid);
      if (!hydrated) {
        // WHY: Callable succeeded but local SSOT not confirmed — surface sync failure, not fake success.
        setErrorReason('failed');
        return;
      }
      setSuccessDays(result.grantDays);
      setCode('');
      onRedeemed?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      {variant === 'inline' ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t('promoCodeTitle')}
        </p>
      ) : null}

      {/* WHY: Shared h-10 shell — opacity swap (not height accordion) so plan cards do not jump. */}
      <div className="relative h-10 w-full">
        {canCollapse ? (
          <button
            ref={toggleRef}
            type="button"
            id={toggleId}
            aria-expanded={showForm}
            aria-controls={panelId}
            className={`absolute inset-0 flex h-10 w-full items-center justify-between rounded-full border border-zinc-800 bg-zinc-900/60 px-4 text-left transition-[opacity,border-color] duration-200 ease-out hover:border-amber-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60 motion-reduce:transition-none ${
              showForm ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            tabIndex={showForm ? -1 : 0}
            aria-hidden={showForm}
            inert={showForm ? true : undefined}
            onClick={() => setExpanded(true)}
          >
            <span className="flex min-w-0 items-center gap-2 text-sm text-zinc-200">
              <span aria-hidden>🎟️</span>
              <span className="truncate">{t('promoCodeLink')}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-500">
              {t('promoCodeEnterHint')}
              <span aria-hidden>❯</span>
            </span>
          </button>
        ) : null}

        <form
          id={panelId}
          role={canCollapse ? 'region' : undefined}
          aria-labelledby={canCollapse ? toggleId : undefined}
          className={`absolute inset-0 flex h-10 w-full items-stretch overflow-hidden rounded-full border border-zinc-800 bg-zinc-950 transition-[opacity,border-color] duration-200 ease-out focus-within:border-amber-400/40 motion-reduce:transition-none ${
            showForm ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!showForm}
          inert={!showForm ? true : undefined}
          onSubmit={(e) => void handleSubmit(e)}
        >
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('promoCodePlaceholder')}
            disabled={busy || !showForm}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            enterKeyHint="done"
            className="min-w-0 flex-1 bg-transparent px-3.5 font-mono text-sm uppercase tracking-wider text-zinc-100 placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-600 focus:outline-none disabled:opacity-60"
          />
          {canCollapse ? (
            <button
              type="button"
              disabled={busy || !showForm}
              aria-label={t('promoCodeCancel')}
              className="flex h-full w-8 shrink-0 items-center justify-center text-sm text-zinc-500 transition hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-400/60 disabled:opacity-60"
              onClick={collapse}
            >
              <span aria-hidden>✕</span>
            </button>
          ) : null}
          {/* WHY: min-w keeps Redeem ↔ Redeeming… from nudging the mono input width. */}
          <button
            type="submit"
            disabled={busy || !showForm || !code.trim()}
            className="h-full min-w-[5.5rem] shrink-0 bg-accent-primary px-4 text-xs font-semibold text-black transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black/40 disabled:opacity-60"
          >
            {busy ? t('promoCodeBusy') : t('promoCodeSubmit')}
          </button>
        </form>
      </div>

      {successDays != null ? (
        <p className="mt-2 text-sm text-emerald-300" role="status" aria-live="polite">
          {t('promoCodeSuccess', { days: successDays })}
        </p>
      ) : null}
      {errorReason ? (
        <p className="mt-2 text-sm text-rose-400" role="status" aria-live="polite">
          {t(errorKey(errorReason))}
        </p>
      ) : null}
    </div>
  );
};

export default PromoCodeRedeemPanel;
