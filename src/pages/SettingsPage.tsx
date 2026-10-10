import { useEffect, useState, type CSSProperties, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import DynoIntelClearHistoryDialog from '../components/dynoIntel/DynoIntelClearHistoryDialog';
import LadderBlockedUsersSheet from '../components/ladder/LadderBlockedUsersSheet';
import MembershipStatusCard from '../components/membership/MembershipStatusCard';
import PromoCodeRedeemPanel from '../components/promo/PromoCodeRedeemPanel';
import SettingsFeedbackBanners from '../components/settings/SettingsFeedbackBanners';
import SettingsListRow from '../components/settings/SettingsListRow';
import SettingsSectionCard from '../components/settings/SettingsSectionCard';
import { SettingsGlyph } from '../components/settings/settingsRowIcons';
import UserProIdentityRow from '../components/UserProIdentityRow';
import { APP_SHELL_SCROLL_BOTTOM_PX, bottomChromeCalc } from '../constants/bottomChrome';
import { resolveIdentityInitial } from '../logic/core/identity';
import { useSettingsPage } from '../hooks/useSettingsPage';
import { useLadderBlockStore } from '../stores/ladderBlockStore';

const RESTORE_TOAST_MS = 3500;

/** Clears BottomNav + DYNO hex + Dyno Intel chip (+ safe-area). */
const RESTORE_TOAST_BOTTOM_STYLE = {
  bottom: bottomChromeCalc(APP_SHELL_SCROLL_BOTTOM_PX),
} satisfies CSSProperties;

const SettingsPage: FC = () => {
  const { t } = useTranslation('common');
  const [restoreToastVisible, setRestoreToastVisible] = useState(false);
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const [blockedUsersSheetOpen, setBlockedUsersSheetOpen] = useState(false);
  const hydrateBlockedUids = useLadderBlockStore((s) => s.hydrate);
  const blockedUidCount = useLadderBlockStore((s) => s.blockedEntries.length);
  const {
    authStatus,
    displayName,
    photoURL,
    email,
    isAnonymous,
    isPro,
    membership,
    locale,
    soundEnabled,
    soundSettingsVisible,
    busyAction,
    banner,
    canSignIn,
    showAppleSignIn,
    canSignOut,
    canDeleteAccount,
    canRestorePurchases,
    dynoIntelLogCount,
    goToAbout,
    goToContact,
    goToPrivacyPolicy,
    goToJoinArena,
    goToProUpsell,
    goToAdmin,
    reCalibrateBoot,
    toggleLocale,
    toggleSound,
    deleteAccount,
    signInGoogle,
    signInApple,
    signOut,
    restorePurchases,
    openManageSubscription,
    clearDynoIntelHistory,
    isAdmin,
    adminCheckReady,
  } = useSettingsPage();
  const isLinkedSignedIn = authStatus === 'signed-in' && !isAnonymous;
  const localeBadge =
    locale === 'zh-Hant' ? t('settings.localeBadgeZh') : t('settings.localeBadgeEn');

  useEffect(() => {
    hydrateBlockedUids();
  }, [hydrateBlockedUids]);

  useEffect(() => {
    if (banner !== 'restore-ok') return;
    setRestoreToastVisible(true);
    const timer = window.setTimeout(() => {
      setRestoreToastVisible(false);
    }, RESTORE_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [banner]);

  return (
    <main className="ui-shell relative max-w-3xl space-y-6 text-zinc-100">
      <header className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-info">
          {t('settings.kicker')}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('settings.title')}</h1>
      </header>

      {/* S1 — Account & Subscription */}
      <SettingsSectionCard title={t('settings.sectionAccountPro')}>
        <MembershipStatusCard
          embedded
          membership={membership}
          onUnlockPro={goToProUpsell}
          onSubscribe={goToProUpsell}
        />

        <div className="space-y-3 px-4 py-3">
          <div className="rounded-lg border border-zinc-700/80 bg-bg-panel/70 px-3 py-2.5">
            {isLinkedSignedIn ? (
              <UserProIdentityRow
                isPro={isPro}
                avatarSize="md"
                avatarUrl={photoURL}
                avatarFallback={resolveIdentityInitial(displayName, email)}
                name={t('settings.signedInAs', { name: displayName })}
                nameClassName="text-sm text-zinc-200"
                subtitle={email}
              />
            ) : (
              <>
                <p className="text-sm text-zinc-200">
                  {authStatus === 'loading' ? t('settings.loadingAuth') : t('settings.signedOut')}
                </p>
                {email ? <p className="text-xs text-zinc-400">{email}</p> : null}
              </>
            )}
          </div>

          <SettingsFeedbackBanners banner={banner} />

          {canSignIn ? (
            <div className="flex flex-wrap gap-2">
              {showAppleSignIn ? (
                <button
                  type="button"
                  className="ui-btn ui-btn-primary"
                  onClick={() => void signInApple()}
                  disabled={!canSignIn}
                >
                  {busyAction === 'sign-in-apple'
                    ? t('settings.signInBusy')
                    : t('settings.signInApple')}
                </button>
              ) : null}
              <button
                type="button"
                className={`ui-btn ${showAppleSignIn ? '' : 'ui-btn-primary'}`}
                onClick={() => void signInGoogle()}
                disabled={!canSignIn}
              >
                {busyAction === 'sign-in' ? t('settings.signInBusy') : t('settings.signInGoogle')}
              </button>
            </div>
          ) : null}

          {isLinkedSignedIn ? <PromoCodeRedeemPanel variant="inline" /> : null}
        </div>

        <SettingsListRow
          icon={<SettingsGlyph label="RC" />}
          title={
            busyAction === 'restore-purchases'
              ? t('settings.restorePurchasesBusy')
              : t('settings.restorePurchases')
          }
          disabled={!canRestorePurchases}
          onClick={() => void restorePurchases()}
        />
        <SettingsListRow
          icon={<SettingsGlyph label="SUB" />}
          title={t('settings.manageSubscription')}
          onClick={() => void openManageSubscription()}
        />
        <SettingsListRow
          icon={<SettingsGlyph label="AR" />}
          title={t('settings.manageArena')}
          onClick={goToJoinArena}
        />
      </SettingsSectionCard>

      {/* S2 — Ladder & Privacy */}
      <SettingsSectionCard title={t('settings.sectionLadderPrivacy')}>
        <SettingsListRow
          icon={<SettingsGlyph label="BL" />}
          title={t('settings.blocked_users_title')}
          subtitle={blockedUidCount === 0 ? t('settings.blocked_empty') : undefined}
          badge={t('settings.blocked_count', { count: blockedUidCount })}
          onClick={() => setBlockedUsersSheetOpen(true)}
        />
      </SettingsSectionCard>

      {/* Preferences — language / sound */}
      <SettingsSectionCard title={t('settings.sectionPreferences')}>
        <SettingsListRow
          icon={<SettingsGlyph label="LN" />}
          title={t('settings.languageSection')}
          badge={localeBadge}
          onClick={toggleLocale}
        />
        {soundSettingsVisible ? (
          <SettingsListRow
            icon={<SettingsGlyph label="FX" />}
            title={t('settings.soundSection')}
            badge={soundEnabled ? t('settings.soundOn') : t('settings.soundOff')}
            onClick={toggleSound}
          />
        ) : null}
      </SettingsSectionCard>

      {/* S3 — Local Data & Diagnostics */}
      <SettingsSectionCard title={t('settings.sectionLocalDiagnostics')}>
        <SettingsListRow
          icon={<SettingsGlyph label="DY" />}
          title={t('settings.clearDynoHistoryTitle')}
          subtitle={t('settings.clearDynoHistoryHint', { count: dynoIntelLogCount })}
          badge={dynoIntelLogCount > 0 ? String(dynoIntelLogCount) : undefined}
          disabled={dynoIntelLogCount === 0}
          onClick={() => setClearHistoryDialogOpen(true)}
        />
        <SettingsListRow
          icon={<SettingsGlyph label="BOOT" />}
          title={t('settings.system.reCalibrate')}
          badge={t('settings.system.reCalibrateKicker')}
          onClick={reCalibrateBoot}
        />
      </SettingsSectionCard>

      {/* Support */}
      <SettingsSectionCard title={t('settings.supportSection')}>
        <SettingsListRow
          icon={<SettingsGlyph label="AB" />}
          title={t('settings.openAbout')}
          onClick={goToAbout}
        />
        <SettingsListRow
          icon={<SettingsGlyph label="PR" />}
          title={t('settings.openPrivacyPolicy')}
          onClick={goToPrivacyPolicy}
        />
        <SettingsListRow
          icon={<SettingsGlyph label="MSG" />}
          title={t('settings.contactUs')}
          onClick={goToContact}
        />
      </SettingsSectionCard>

      {adminCheckReady && isAdmin ? (
        <SettingsSectionCard title={t('settings.adminSection')} variant="accent">
          <SettingsListRow
            icon={<SettingsGlyph label="AD" />}
            title={t('settings.openAdmin')}
            onClick={goToAdmin}
          />
        </SettingsSectionCard>
      ) : null}

      {/*
        WHY: Extra top padding isolates Danger from Support — avoid fighting space-y with !mt.
      */}
      <div className="pt-4">
        <SettingsSectionCard title={t('settings.dangerZone')} variant="danger">
          <SettingsListRow
            icon={<SettingsGlyph label="OUT" />}
            title={busyAction === 'sign-out' ? t('settings.signOutBusy') : t('settings.signOut')}
            destructive
            showChevron={false}
            disabled={!canSignOut}
            onClick={() => void signOut()}
          />
          <div className="px-4 py-3">
            <p className="text-xs leading-relaxed text-zinc-400">{t('settings.deleteHint')}</p>
          </div>
          <SettingsListRow
            icon={<SettingsGlyph label="DEL" />}
            title={
              busyAction === 'delete-account'
                ? t('settings.deleteBusy')
                : t('settings.deleteAccountAction')
            }
            destructive
            showChevron={false}
            disabled={!canDeleteAccount}
            onClick={() => void deleteAccount()}
          />
        </SettingsSectionCard>
      </div>

      {restoreToastVisible ? (
        <div
          role="status"
          aria-live="polite"
          style={RESTORE_TOAST_BOTTOM_STYLE}
          className="pointer-events-none fixed inset-x-4 z-[1100] mx-auto max-w-md rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-center text-sm font-medium text-emerald-50 shadow-[0_0_24px_rgba(52,211,153,0.2)] backdrop-blur-md"
        >
          {t('settings.restorePurchasesSuccess')}
        </div>
      ) : null}
      <DynoIntelClearHistoryDialog
        open={clearHistoryDialogOpen}
        onCancel={() => setClearHistoryDialogOpen(false)}
        onConfirm={() => {
          clearDynoIntelHistory();
          setClearHistoryDialogOpen(false);
        }}
      />
      <LadderBlockedUsersSheet
        open={blockedUsersSheetOpen}
        onClose={() => setBlockedUsersSheetOpen(false)}
      />
    </main>
  );
};

export default SettingsPage;
