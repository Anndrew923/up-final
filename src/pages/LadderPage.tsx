import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../config/routes';
import { useLeaderboardAccess } from '../hooks/useLeaderboardAccess';

/**
 * Leaderboard arena entry — **no Firestore imports**. Non-eligible users redirect to Join Arena before any leaderboard I/O.
 */
export default function LadderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEnter } = useLeaderboardAccess();

  useEffect(() => {
    if (!canEnter) {
      navigate(ROUTES.joinArena, { replace: true });
    }
  }, [canEnter, navigate]);

  if (!canEnter) {
    return (
      <main className="ui-shell max-w-xl">
        <p className="text-sm text-zinc-500">{t('ladder.redirecting', { ns: 'common' })}</p>
      </main>
    );
  }

  return (
    <main className="ui-shell max-w-3xl space-y-6">
      <section className="relative overflow-hidden rounded-xl border border-accent-primary/40 bg-bg-card shadow-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/45 to-transparent" />
        <div className="px-5 py-8 md:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-primary">
            {t('ladder.kicker', { ns: 'common' })}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
            {t('ladder.title', { ns: 'common' })}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {t('ladder.body', { ns: 'common' })}
          </p>
          <p className="mt-4 rounded-lg border border-zinc-800 bg-bg-panel/80 px-3 py-2 text-xs text-zinc-500">
            {t('ladder.noNetworkNote', { ns: 'common' })}
          </p>
        </div>
      </section>
    </main>
  );
}
