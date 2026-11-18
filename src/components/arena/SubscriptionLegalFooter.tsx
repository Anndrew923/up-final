import { useState, type FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import {
  RESTORE_PURCHASES_STATUS_I18N_KEY,
  type RestorePurchasesStatus,
} from '../../logic/core/restorePurchasesStatus';
import TermsLegalModal from '../legal/TermsLegalModal';

export interface SubscriptionLegalFooterProps {
  /** Extra top spacing when nested in dense paywall sheets. */
  className?: string;
  /**
   * WHY: DynoIntel sheet lives in AppShell; privacy is a full route.
   * Callers that own an overlay must dismiss it before navigate or the
   * sheet stays mounted on top of Privacy Policy.
   */
  onBeforePrivacyNavigate?: () => void;
  /**
   * WHY: Apple Guideline 3.1.2 — restore must be reachable on every paid-subscribe surface.
   * When omitted, the restore control is hidden (non-subscribe hosts).
   */
  onRestorePurchases?: () => void;
  restoreBusy?: boolean;
  /** Host-level lock (auth/billing busy) — still shows the control, but non-interactive. */
  restoreDisabled?: boolean;
  restoreStatus?: RestorePurchasesStatus;
}

const RESTORE_STATUS_TEXT_CLASS: Record<Exclude<RestorePurchasesStatus, 'idle'>, string> = {
  'restore-ok': 'text-emerald-400/90',
  'restore-empty': 'text-zinc-500',
  'restore-invalid-expiry': 'text-amber-300/90',
  'restore-sync-failed': 'text-amber-300/90',
  'restore-fail': 'text-rose-300/90',
};

/**
 * WHY: Apple 3.1.2 / Play billing require auto-renew disclosure plus
 * reachable Terms + Privacy links on every paid-subscribe surface.
 * Restore Purchases sits with the legal row so it stays visible without competing with the primary CTA.
 */
const SubscriptionLegalFooter: FC<SubscriptionLegalFooterProps> = ({
  className = '',
  onBeforePrivacyNavigate,
  onRestorePurchases,
  restoreBusy = false,
  restoreDisabled = false,
  restoreStatus = 'idle',
}) => {
  const { t } = useTranslation(['arena', 'common']);
  const navigate = useNavigate();
  const [termsOpen, setTermsOpen] = useState(false);
  const showRestore = typeof onRestorePurchases === 'function';
  const restoreLocked = restoreBusy || restoreDisabled;

  return (
    <div className={`space-y-2 text-center ${className}`.trim()}>
      <p className="text-[11px] leading-relaxed text-zinc-500 text-pretty">
        {t('autoRenewDisclosure')}
      </p>
      <p className="text-[11px] leading-relaxed text-zinc-500">
        <Trans
          ns="arena"
          i18nKey="legalFooter"
          components={{
            terms: (
              <button
                type="button"
                className="underline underline-offset-2 transition hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
                onClick={() => setTermsOpen(true)}
              />
            ),
            privacy: (
              <button
                type="button"
                className="underline underline-offset-2 transition hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
                onClick={() => {
                  onBeforePrivacyNavigate?.();
                  navigate(ROUTES.privacyPolicy);
                }}
              />
            ),
          }}
        />
      </p>
      {showRestore ? (
        <div className="space-y-1.5 pt-0.5">
          <button
            type="button"
            data-testid="subscription-restore-purchases"
            className="mx-auto block text-[11px] text-zinc-500 underline underline-offset-2 transition hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            disabled={restoreLocked}
            onClick={() => {
              if (restoreLocked) return;
              onRestorePurchases();
            }}
          >
            {restoreBusy
              ? t('settings.restorePurchasesBusy', { ns: 'common' })
              : t('settings.restorePurchases', { ns: 'common' })}
          </button>
          {restoreStatus !== 'idle' ? (
            <p
              role="status"
              aria-live="polite"
              data-testid="subscription-restore-status"
              className={`px-1 text-[11px] leading-relaxed text-pretty ${RESTORE_STATUS_TEXT_CLASS[restoreStatus]}`}
            >
              {t(RESTORE_PURCHASES_STATUS_I18N_KEY[restoreStatus], { ns: 'common' })}
            </p>
          ) : null}
        </div>
      ) : null}
      <TermsLegalModal open={termsOpen} mode="preview" onClose={() => setTermsOpen(false)} />
    </div>
  );
};

export default SubscriptionLegalFooter;
