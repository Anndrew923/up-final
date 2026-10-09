import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { MembershipCardKind, MembershipStatusView } from '../../logic/core/membershipStatus';

export interface MembershipStatusCardProps {
  membership: MembershipStatusView;
  onUnlockPro(): void;
  onSubscribe(): void;
  onManageSubscription(): void;
}

const PLAN_TITLE_KEY: Record<MembershipCardKind, string> = {
  free: 'settings.membership.planFree',
  promo: 'settings.membership.planPromo',
  store: 'settings.membership.planStore',
};

/**
 * Lightweight membership status card for Settings (and optional paywall reuse).
 * WHY: Presentational only — entitlement projection + navigation stay in the hook
 * so this card never touches RevenueCat / Firestore / store SDKs.
 */
const MembershipStatusCard: FC<MembershipStatusCardProps> = ({
  membership,
  onUnlockPro,
  onSubscribe,
  onManageSubscription,
}) => {
  const { t } = useTranslation('common');
  const isProKind = membership.kind === 'promo' || membership.kind === 'store';

  return (
    <section
      className={`space-y-4 rounded-2xl border p-6 shadow-panel backdrop-blur ${
        isProKind
          ? 'border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 via-bg-card/95 to-bg-card/95'
          : 'border-zinc-800 bg-bg-card/95'
      }`}
      aria-label={t('settings.membership.sectionLabel')}
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t('settings.membership.sectionLabel')}
        </h2>
        <p
          className={`text-base font-semibold ${isProKind ? 'text-emerald-100' : 'text-zinc-100'}`}
        >
          {t(PLAN_TITLE_KEY[membership.kind])}
        </p>
      </div>

      {membership.kind === 'promo' && membership.displayDate != null ? (
        <p className="text-sm leading-relaxed text-zinc-300">
          {t('settings.membership.promoExpiry', {
            date: membership.displayDate,
            days: membership.remainingDays ?? 0,
          })}
        </p>
      ) : null}

      {membership.kind === 'store' && membership.displayDate != null ? (
        <p className="text-sm leading-relaxed text-zinc-300">
          {t('settings.membership.storeRenewal', { date: membership.displayDate })}
        </p>
      ) : null}

      {membership.kind === 'store' && membership.promoPaused ? (
        <p className="text-xs leading-relaxed text-emerald-300/90">
          {t('settings.membership.promoPausedHint')}
        </p>
      ) : null}

      {membership.kind === 'free' ? (
        <p className="text-xs leading-relaxed text-zinc-500">
          {t('settings.membership.inviteHint')}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 pt-4">
        {membership.kind === 'free' ? (
          <button type="button" className="ui-btn ui-btn-primary" onClick={onUnlockPro}>
            {t('settings.membership.unlockPro')}
          </button>
        ) : null}
        {membership.kind === 'promo' ? (
          <button type="button" className="ui-btn ui-btn-primary" onClick={onSubscribe}>
            {t('settings.membership.subscribeNow')}
          </button>
        ) : null}
        {membership.kind === 'store' ? (
          <button type="button" className="ui-btn" onClick={onManageSubscription}>
            {t('settings.manageSubscription')}
          </button>
        ) : null}
      </div>
    </section>
  );
};

export default MembershipStatusCard;
