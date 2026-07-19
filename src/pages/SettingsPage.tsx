import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import DynoIntelClearHistoryDialog from '../components/dynoIntel/DynoIntelClearHistoryDialog';
import { useSettingsPage } from '../hooks/useSettingsPage';

export interface SettingsPageProps {
  onBack?: () => void;
}

const RESTORE_TOAST_MS = 3500;

const SettingsPage: FC<SettingsPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const [restoreToastVisible, setRestoreToastVisible] = useState(false);
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const {
    authStatus,
    displayName,
    email,
    isAnonymous,
    locale,
    soundEnabled,
    soundSettingsVisible,
    busyAction,
    banner,
    canSignIn,
    canSignOut,
    canDeleteAccount,
    canRestorePurchases,
    dynoIntelLogCount,
    goToAbout,
    goToContact,
    goToPrivacyPolicy,
    goToJoinArena,
    reCalibrateBoot,
    toggleLocale,
    toggleSound,
    deleteAccount,
    signInGoogle,
    signOut,
    restorePurchases,
    clearDynoIntelHistory,
  } = useSettingsPage();
  const isGoogleSignedIn = authStatus === 'signed-in' && !isAnonymous;

  useEffect(() => {
    if (banner !== 'restore-ok') return;
    setRestoreToastVisible(true);
    const timer = window.setTimeout(() => {
      setRestoreToastVisible(false);
    }, RESTORE_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [banner]);

  return (
    <main className="ui-shell relative max-w-3xl space-y-8 text-zinc-100">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-info">
            {t('settings.kicker')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('settings.title')}</h1>
        </div>
        {onBack ? (
          <button type="button" className="ui-btn shrink-0" onClick={onBack}>
            {t('back')}
          </button>
        ) : null}
      </header>

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t('settings.languageSection')}
        </h2>
        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-4">
          <span className="rounded-full border border-zinc-700 bg-bg-panel/70 px-3 py-1 text-xs text-zinc-300">
            {t('settings.languageCurrent', { locale: locale === 'zh-Hant' ? '繁中' : 'English' })}
          </span>
          <button
            type="button"
            className="ui-btn border-accent-info/40 text-accent-info hover:bg-accent-info/10"
            onClick={toggleLocale}
          >
            {t('settings.languageToggle')}
          </button>
        </div>
      </section>

      {soundSettingsVisible ? (
        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {t('settings.soundSection')}
          </h2>
          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-4">
            <span className="rounded-full border border-zinc-700 bg-bg-panel/70 px-3 py-1 text-xs text-zinc-300">
              {soundEnabled ? t('settings.soundOn') : t('settings.soundOff')}
            </span>
            <button type="button" className="ui-btn" onClick={toggleSound}>
              {t('settings.soundToggle')}
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t('settings.localDataSection')}
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
          <div>
            <p className="text-sm text-zinc-200">{t('settings.clearDynoHistoryTitle')}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {t('settings.clearDynoHistoryHint', { count: dynoIntelLogCount })}
            </p>
          </div>
          <button
            type="button"
            className="ui-btn shrink-0 border-red-400/35 text-red-200 hover:bg-red-950/35 disabled:opacity-40"
            disabled={dynoIntelLogCount === 0}
            onClick={() => setClearHistoryDialogOpen(true)}
          >
            {t('settings.clearDynoHistoryAction')}
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t('settings.infoSection')}
        </h2>
        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <button type="button" className="ui-btn" onClick={goToAbout}>
            {t('settings.openAbout')}
          </button>
          <button type="button" className="ui-btn" onClick={goToPrivacyPolicy}>
            {t('settings.openPrivacyPolicy')}
          </button>
        </div>
      </section>

      <button
        type="button"
        className="ui-btn flex w-full items-center justify-between border-accent-primary/40 bg-zinc-950/50 px-4 py-4 text-accent-primary transition-colors hover:bg-accent-primary/5 active:scale-[0.98]"
        onClick={reCalibrateBoot}
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100">
            {t('settings.system.reCalibrate')}
          </span>
          <span className="rounded-full border border-accent-primary/30 bg-accent-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-primary/90">
            {t('settings.system.reCalibrateKicker')}
          </span>
        </span>
        <span className="shrink-0 text-xs text-zinc-500" aria-hidden>
          →
        </span>
      </button>

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t('settings.supportSection')}
        </h2>
        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <button type="button" className="ui-btn" onClick={goToContact}>
            {t('settings.contactUs')}
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t('settings.accountSection')}
        </h2>

        <div className="space-y-1 rounded-lg border border-zinc-700 bg-bg-panel/70 px-4 py-3">
          <p className="text-sm text-zinc-200">
            {isGoogleSignedIn
              ? t('settings.signedInAs', { name: displayName })
              : authStatus === 'loading'
                ? t('settings.loadingAuth')
                : t('settings.signedOut')}
          </p>
          {email ? <p className="text-xs text-zinc-400">{email}</p> : null}
        </div>

        {banner === 'sign-in-fail' ? (
          <p className="text-sm text-rose-400">{t('settings.signInFail')}</p>
        ) : null}
        {banner === 'sign-out-ok' ? (
          <p className="text-sm text-emerald-400">{t('settings.signOutOk')}</p>
        ) : null}
        {banner === 'sign-out-fail' ? (
          <p className="text-sm text-rose-400">{t('settings.signOutFail')}</p>
        ) : null}
        {banner === 'restore-empty' ? (
          <p className="text-sm text-zinc-400">{t('settings.restorePurchasesEmpty')}</p>
        ) : null}
        {banner === 'restore-fail' ? (
          <p className="text-sm text-rose-400">{t('settings.restorePurchasesFail')}</p>
        ) : null}
        {banner === 'delete-success' ? (
          <p className="text-sm text-emerald-400">{t('settings.deleteSuccess')}</p>
        ) : null}
        {banner === 'delete-requires-recent-login' ? (
          <p className="text-sm text-amber-300">{t('settings.deleteRequiresRecentLogin')}</p>
        ) : null}
        {banner === 'delete-reauth-fail' ? (
          <p className="text-sm text-rose-400">{t('settings.deleteReauthFail')}</p>
        ) : null}
        {banner === 'delete-cloud-partial' ? (
          <p className="text-sm text-amber-300">{t('settings.deleteCloudPartial')}</p>
        ) : null}
        {banner === 'delete-auth-fail' ? (
          <p className="text-sm text-rose-400">{t('settings.deleteAuthFail')}</p>
        ) : null}
        {banner === 'delete-not-allowed' ? (
          <p className="text-sm text-zinc-300">{t('settings.deleteNotAllowed')}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <button
            type="button"
            className="ui-btn ui-btn-primary"
            onClick={() => void signInGoogle()}
            disabled={!canSignIn}
          >
            {busyAction === 'sign-in' ? t('settings.signInBusy') : t('settings.signInGoogle')}
          </button>
          <button
            type="button"
            className="ui-btn"
            onClick={() => void signOut()}
            disabled={!canSignOut}
          >
            {busyAction === 'sign-out' ? t('settings.signOutBusy') : t('settings.signOut')}
          </button>
          <button type="button" className="ui-btn" onClick={goToJoinArena}>
            {t('settings.manageArena')}
          </button>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-zinc-700/60 bg-zinc-950/40 px-4 py-3.5 text-left transition hover:border-zinc-500 hover:bg-zinc-900/60 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void restorePurchases()}
          disabled={!canRestorePurchases}
        >
          <span className="text-sm font-medium text-zinc-300">
            {busyAction === 'restore-purchases'
              ? t('settings.restorePurchasesBusy')
              : t('settings.restorePurchases')}
          </span>
          <span className="text-xs text-zinc-500" aria-hidden>
            →
          </span>
        </button>

        <div className="space-y-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">
            {t('settings.dangerZone')}
          </p>
          <p className="text-sm text-zinc-300">{t('settings.deleteHint')}</p>
          <button
            type="button"
            className="ui-btn border-rose-400/60 text-rose-300 hover:bg-rose-500/10"
            onClick={() => void deleteAccount()}
            disabled={!canDeleteAccount}
          >
            {busyAction === 'delete-account'
              ? t('settings.deleteBusy')
              : t('settings.deleteAccountAction')}
          </button>
        </div>
      </section>

      {restoreToastVisible ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-24 z-[1100] mx-auto max-w-md rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-center text-sm font-medium text-emerald-50 shadow-[0_0_24px_rgba(52,211,153,0.2)] backdrop-blur-md sm:bottom-8"
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
    </main>
  );
};

export default SettingsPage;
