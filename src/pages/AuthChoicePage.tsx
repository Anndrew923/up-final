import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { markAuthOnboardingCompleted } from '../services/authOnboardingService';
import { waitForAnonymousAuthSession } from '../services/authSessionWait';
import { signInAnonymouslyWeb, signInWithGoogleWeb } from '../services/firebaseClient';

const AuthChoicePage: FC = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<'none' | 'google' | 'guest'>('none');
  const [error, setError] = useState(false);
  const returnTo =
    location.state && typeof location.state === 'object' && 'returnTo' in location.state
      ? location.state.returnTo
      : undefined;
  const targetRoute = (() => {
    if (returnTo === ROUTES.ladder) return ROUTES.ladder;
    if (returnTo === ROUTES.tools) return ROUTES.tools;
    return ROUTES.home;
  })();

  const completeFlow = () => {
    markAuthOnboardingCompleted();
    navigate(targetRoute, { replace: true });
  };

  const handleGoogle = async () => {
    setError(false);
    setBusy('google');
    try {
      const user = await signInWithGoogleWeb();
      if (!user) {
        return;
      }
      completeFlow();
    } catch {
      setError(true);
    } finally {
      setBusy('none');
    }
  };

  const handleGuest = async () => {
    setError(false);
    setBusy('guest');
    try {
      await signInAnonymouslyWeb();
      await waitForAnonymousAuthSession();
      completeFlow();
    } catch {
      setError(true);
    } finally {
      setBusy('none');
    }
  };

  return (
    <main className="ui-shell relative flex min-h-screen max-w-xl items-center text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-accent-primary/20 blur-[90px]" />
        <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-accent-info/15 blur-[90px]" />
      </div>
      <section className="relative w-full space-y-6 rounded-2xl border border-zinc-800 bg-bg-card/90 p-6 shadow-panel backdrop-blur">
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent-info">
            {t('authChoice.kicker')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            {t('authChoice.title')}
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">{t('authChoice.subtitle')}</p>
        </header>

        {error ? (
          <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {t('authChoice.fail')}
          </p>
        ) : null}

        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={busy !== 'none'}
            className="ui-btn ui-btn-primary w-full justify-center"
          >
            {busy === 'google' ? t('authChoice.googleBusy') : t('authChoice.google')}
          </button>
          <button
            type="button"
            onClick={() => void handleGuest()}
            disabled={busy !== 'none'}
            className="ui-btn w-full justify-center"
          >
            {busy === 'guest' ? t('authChoice.guestBusy') : t('authChoice.guest')}
          </button>
        </div>
        <p className="text-xs leading-relaxed text-zinc-500">{t('authChoice.note')}</p>
      </section>
    </main>
  );
};

export default AuthChoicePage;
