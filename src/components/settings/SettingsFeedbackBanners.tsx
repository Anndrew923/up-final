import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { SettingsBanner } from '../../hooks/useSettingsPage';

export interface SettingsFeedbackBannersProps {
  banner: SettingsBanner;
}

const BANNER_CLASS: Record<
  Exclude<SettingsBanner, 'idle' | 'restore-ok'>,
  string
> = {
  'sign-in-fail': 'text-rose-400',
  'sign-in-apple-fail': 'text-rose-400',
  'sign-out-ok': 'text-emerald-400',
  'sign-out-fail': 'text-rose-400',
  'restore-empty': 'text-zinc-400',
  'restore-invalid-expiry': 'text-amber-300',
  'restore-sync-failed': 'text-amber-300',
  'restore-fail': 'text-rose-400',
  'delete-success': 'text-emerald-400',
  'delete-requires-recent-login': 'text-amber-300',
  'delete-reauth-fail': 'text-rose-400',
  'delete-cloud-partial': 'text-amber-300',
  'delete-auth-fail': 'text-rose-400',
  'delete-not-allowed': 'text-zinc-300',
};

const BANNER_KEY: Record<Exclude<SettingsBanner, 'idle' | 'restore-ok'>, string> = {
  'sign-in-fail': 'settings.signInFail',
  'sign-in-apple-fail': 'settings.signInAppleFail',
  'sign-out-ok': 'settings.signOutOk',
  'sign-out-fail': 'settings.signOutFail',
  'restore-empty': 'settings.restorePurchasesEmpty',
  'restore-invalid-expiry': 'settings.restorePurchasesInvalidExpiry',
  'restore-sync-failed': 'settings.restorePurchasesSyncFailed',
  'restore-fail': 'settings.restorePurchasesFail',
  'delete-success': 'settings.deleteSuccess',
  'delete-requires-recent-login': 'settings.deleteRequiresRecentLogin',
  'delete-reauth-fail': 'settings.deleteReauthFail',
  'delete-cloud-partial': 'settings.deleteCloudPartial',
  'delete-auth-fail': 'settings.deleteAuthFail',
  'delete-not-allowed': 'settings.deleteNotAllowed',
};

/**
 * Maps Settings facade banners to a single inline message.
 * WHY: Keep SettingsPage composition focused on IA; toast handles restore-ok separately.
 */
const SettingsFeedbackBanners: FC<SettingsFeedbackBannersProps> = ({ banner }) => {
  const { t } = useTranslation('common');
  if (banner === 'idle' || banner === 'restore-ok') return null;
  return <p className={`text-sm ${BANNER_CLASS[banner]}`}>{t(BANNER_KEY[banner])}</p>;
};

export default SettingsFeedbackBanners;
