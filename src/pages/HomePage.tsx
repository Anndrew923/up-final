import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HomeLadderIdentitySection from '../components/home/HomeLadderIdentitySection';
import HomeProfileForm from '../components/home/HomeProfileForm';
import HomeRadarBoard from '../components/home/HomeRadarBoard';
import ProBadge from '../components/ProBadge';
import { joinArenaPath } from '../lib/joinArenaNavigation';
import { ROUTES } from '../config/routes';
import { useLeaderboardAccess } from '../hooks/useLeaderboardAccess';
import { useEntitlementStore } from '../stores/entitlementStore';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const access = useLeaderboardAccess();
  const setPurchaseStatus = useEntitlementStore((state) => state.setPurchaseStatus);
  const setSubscriptionStatus = useEntitlementStore((state) => state.setSubscriptionStatus);
  const debugEnabled = import.meta.env.DEV;

  return (
    <main className="ui-shell max-w-4xl space-y-8 pb-6 md:space-y-10 md:pb-10">
      {/* No extra section padding — `ui-shell` + `HomeRadarBoard` control vertical rhythm. */}
      <section>
        <HomeRadarBoard />
      </section>

      {/* Profile stays below radar; collapses once baseline is complete (radar-first density). */}
      <HomeProfileForm />

      <HomeLadderIdentitySection />

      <section className="ui-card space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t('shellTitle', { ns: 'common' })}</h1>
          <p className="text-sm text-zinc-300">{t('shellSubtitle', { ns: 'common' })}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {debugEnabled ? (
            <>
              <button type="button" className="ui-btn" onClick={() => setPurchaseStatus('owned')}>
                {t('setCoreOwned', { ns: 'common' })}
              </button>
              <button
                type="button"
                className="ui-btn"
                onClick={() => setSubscriptionStatus('free')}
              >
                {t('setFree', { ns: 'common' })}
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-primary"
                onClick={() => setSubscriptionStatus('pro')}
              >
                {t('setPro', { ns: 'common' })}
              </button>
            </>
          ) : null}
          <ProBadge />
        </div>

        {debugEnabled ? (
          <div className="grid gap-1 text-sm md:grid-cols-2">
            <p className="ui-kv">
              {t('canEnter', { ns: 'common' })}: {String(access.canEnter)}
            </p>
            <p className="ui-kv">
              {t('reason', { ns: 'common' })}: {access.reason}
            </p>
          </div>
        ) : null}

        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            className="ui-btn ui-btn-primary"
            onClick={() => {
              if (access.reason === 'auth-required') {
                navigate(ROUTES.authChoice, { state: { returnTo: ROUTES.ladder } });
                return;
              }
              if (access.shouldShowJoinArena) {
                navigate(joinArenaPath('ladder'));
                return;
              }
              if (access.canEnter) {
                navigate(ROUTES.ladder);
                return;
              }
              navigate(ROUTES.leaderboardDebug);
            }}
          >
            {t('enterLeaderboard', { ns: 'common' })}
          </button>
          {debugEnabled ? (
            <button
              type="button"
              className="ui-btn"
              onClick={() => navigate(ROUTES.leaderboardDebug)}
            >
              {t('openDebugPanel', { ns: 'common' })}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
