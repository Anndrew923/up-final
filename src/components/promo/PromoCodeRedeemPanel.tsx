import { useState, type FC, type FormEvent } from 'react';
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
    default:
      return 'promoCodeErrorGeneric';
  }
}

export interface PromoCodeRedeemPanelProps {
  /** Compact link-style trigger (Paywall) vs always-expanded (Settings). */
  variant?: 'link' | 'inline';
  className?: string;
  onRedeemed?: () => void;
}

/**
 * Coach invite redeem UI — presentational; side effects via promoCodeService + entitlement hydrate.
 */
const PromoCodeRedeemPanel: FC<PromoCodeRedeemPanelProps> = ({
  variant = 'inline',
  className = '',
  onRedeemed,
}) => {
  const { t } = useTranslation('arena');
  const uid = useAuthStore((s) => s.uid);
  const [expanded, setExpanded] = useState(variant === 'inline');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [successDays, setSuccessDays] = useState<number | null>(null);
  const [errorReason, setErrorReason] = useState<RedeemPromoCodeReason | null>(null);

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

  if (variant === 'link' && !expanded) {
    return (
      <div className={className}>
        <button
          type="button"
          className="text-sm font-medium text-accent-info underline-offset-2 hover:underline"
          onClick={() => setExpanded(true)}
        >
          {t('promoCodeLink')}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`space-y-3 rounded-2xl border border-zinc-800 bg-bg-card/80 p-4 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {t('promoCodeTitle')}
      </p>
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => void handleSubmit(e)}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t('promoCodePlaceholder')}
          disabled={busy}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-zinc-100 placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-600 focus:border-accent-info/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="ui-btn ui-btn-primary shrink-0 justify-center disabled:opacity-60"
        >
          {busy ? t('promoCodeBusy') : t('promoCodeSubmit')}
        </button>
      </form>
      {variant === 'link' ? (
        <button
          type="button"
          className="text-xs text-zinc-500 hover:text-zinc-300"
          onClick={() => {
            setExpanded(false);
            setErrorReason(null);
            setSuccessDays(null);
          }}
        >
          {t('promoCodeCancel')}
        </button>
      ) : null}
      {successDays != null ? (
        <p className="text-sm text-emerald-300">{t('promoCodeSuccess', { days: successDays })}</p>
      ) : null}
      {errorReason ? (
        <p className="text-sm text-rose-400">{t(errorKey(errorReason))}</p>
      ) : null}
    </div>
  );
};

export default PromoCodeRedeemPanel;
