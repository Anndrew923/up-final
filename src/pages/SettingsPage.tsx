import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsPage } from '../hooks/useSettingsPage';

export interface SettingsPageProps {
  onBack?: () => void;
}

const SettingsPage: FC<SettingsPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const {
    authStatus,
    displayName,
    email,
    isAnonymous,
    busyAction,
    banner,
    canSignIn,
    canSignOut,
    goToJoinArena,
    signInGoogle,
    signOut,
  } = useSettingsPage();
  const isGoogleSignedIn = authStatus === 'signed-in' && !isAnonymous;

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <div className="ui-shell relative max-w-3xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-info">
              {t('settings.kicker')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('settings.title')}</h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{t('settings.subtitle')}</p>
          </div>
          {onBack ? (
            <button type="button" className="ui-btn shrink-0" onClick={onBack}>
              {t('back')}
            </button>
          ) : null}
        </header>

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

          <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              onClick={() => void signInGoogle()}
              disabled={!canSignIn}
            >
              {busyAction === 'sign-in'
                ? t('settings.signInBusy')
                : t('settings.signInGoogle')}
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
        </section>
      </div>
    </main>
  );
};

export default SettingsPage;
