import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';

export interface AboutPageProps {
  onBack?: () => void;
}

const AboutPage: FC<AboutPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.1';

  return (
    <main className="ui-shell relative max-w-3xl space-y-8 text-zinc-100">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-info">
            {t('about.kicker')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('about.title')}</h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{t('about.subtitle')}</p>
        </div>
        {onBack ? (
          <button type="button" className="ui-btn shrink-0" onClick={onBack}>
            {t('back')}
          </button>
        ) : null}
      </header>

      <section className="space-y-3 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
          {t('about.missionTitle')}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-300">{t('about.missionBody')}</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
          {t('about.localDataTitle')}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-300">{t('about.localDataBody')}</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
          {t('about.versionTitle')}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-300">
          {t('about.versionBody', { version: appVersion })}
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
          {t('about.disclaimerTitle')}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-300">{t('about.disclaimerBody')}</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
          {t('about.contactTitle')}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-300">{t('about.contactBody')}</p>
        <Link
          to={ROUTES.privacyPolicy}
          className="inline-flex text-sm text-accent-info underline underline-offset-4"
        >
          {t('about.openPrivacyPolicy')}
        </Link>
      </section>
    </main>
  );
};

export default AboutPage;
