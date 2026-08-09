import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import {
  AboutCard,
  AboutPortrait,
  AdvisorCard,
  FounderListBlock,
  FounderScoreBadge,
  QuoteCallout,
} from './about/AboutUi';
import { ABOUT_PORTRAITS, ADVISOR_PORTRAIT_BY_INDEX } from './about/aboutPortraits';
import { readAdvisorProfiles, readStringList } from './about/aboutI18n';

const AboutPage: FC = () => {
  const { t } = useTranslation('common');
  // WHY: Vite injects package.json version; keep the same fallback as vite.config.ts.
  const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
  const advisors = readAdvisorProfiles(t('about.advisors', { returnObjects: true }));
  const founderCredentials = readStringList(t('about.founderCredentials', { returnObjects: true }));
  const founderVisionGoals = readStringList(t('about.founderVisionGoals', { returnObjects: true }));
  const founderName = t('about.founderName');

  return (
    <main className="ui-shell relative max-w-3xl text-zinc-100">
      <div className="flex flex-col gap-8">
        <header className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-info">
            {t('about.kicker')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('about.title')}</h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{t('about.subtitle')}</p>
        </header>

        <AboutCard title={t('about.missionTitle')} accent>
          <p className="text-sm leading-relaxed text-zinc-300">{t('about.missionBody')}</p>
        </AboutCard>

        <AboutCard title={t('about.founderTitle')} accent>
          <div className="flex items-center gap-4">
            <AboutPortrait src={ABOUT_PORTRAITS.founder} alt={founderName} size="lg" />
            <div className="min-w-0 space-y-1">
              <h3 className="font-mono text-base font-semibold tracking-wide text-zinc-50">
                {founderName}
              </h3>
              <p className="text-xs uppercase tracking-[0.12em] text-accent-info">
                {t('about.founderRole')}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">{t('about.founderStory')}</p>

          <FounderListBlock
            title={t('about.founderCredentialsTitle')}
            items={founderCredentials}
            listKey="founder-credentials"
          />

          <FounderListBlock
            title={t('about.founderVisionTitle')}
            lead={t('about.founderVisionLead')}
            items={founderVisionGoals}
            listKey="founder-vision"
          />

          <FounderScoreBadge label={t('about.founderScoreTitle')} score={t('about.founderScore')} />

          <QuoteCallout>{t('about.founderClosing')}</QuoteCallout>
        </AboutCard>

        <AboutCard title={t('about.advisorsTitle')}>
          <p className="text-sm leading-relaxed text-zinc-400">{t('about.advisorsSubtitle')}</p>
          {advisors.map((advisor, index) => (
            <AdvisorCard
              key={advisor.name}
              {...advisor}
              imageSrc={ADVISOR_PORTRAIT_BY_INDEX[index]}
            />
          ))}
        </AboutCard>

        <AboutCard title={t('about.localDataTitle')}>
          <p className="text-sm leading-relaxed text-zinc-300">{t('about.localDataBody')}</p>
        </AboutCard>

        <AboutCard title={t('about.versionTitle')}>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t('about.versionBody', { version: appVersion })}
          </p>
        </AboutCard>

        <AboutCard title={t('about.disclaimerTitle')}>
          <p className="text-sm leading-relaxed text-zinc-300">{t('about.disclaimerBody')}</p>
        </AboutCard>

        <AboutCard title={t('about.contactTitle')}>
          <p className="text-sm leading-relaxed text-zinc-300">{t('about.contactBody')}</p>
          <Link
            to={ROUTES.privacyPolicy}
            className="inline-flex text-sm text-accent-info underline underline-offset-4"
          >
            {t('about.openPrivacyPolicy')}
          </Link>
        </AboutCard>
      </div>
    </main>
  );
};

export default AboutPage;
