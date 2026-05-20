import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { toSupportedLng } from '../i18n';

export interface PrivacyPolicyPageProps {
  onBack?: () => void;
}

const PrivacyPolicyPage: FC<PrivacyPolicyPageProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation('common');
  const locale = toSupportedLng(i18n.resolvedLanguage ?? i18n.language);
  const policyHref =
    locale === 'zh-Hant' ? '/privacy-policy.zh-Hant.html' : '/privacy-policy.en.html';
  const togglePolicyHref =
    locale === 'zh-Hant' ? '/privacy-policy.en.html' : '/privacy-policy.zh-Hant.html';
  const toggleLabel = locale === 'zh-Hant' ? 'English' : '繁中';

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <div className="ui-shell relative max-w-4xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-info">
              {t('privacy.kicker')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('privacy.title')}</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
              {t('privacy.subtitle')}
            </p>
          </div>
          {onBack ? (
            <button type="button" className="ui-btn shrink-0" onClick={onBack}>
              {t('back')}
            </button>
          ) : null}
        </header>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-bg-card/95 p-4 shadow-panel backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-zinc-700 bg-bg-panel/70 px-3 py-1 text-xs text-zinc-300">
              {t('privacy.currentLanguage', { locale: locale === 'zh-Hant' ? '繁中' : 'English' })}
            </span>
            <a
              href={togglePolicyHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm text-accent-info underline underline-offset-4"
            >
              {t('privacy.openOtherLanguage', { locale: toggleLabel })}
            </a>
          </div>
          <iframe
            title={t('privacy.title')}
            src={policyHref}
            className="h-[70vh] w-full rounded-xl border border-zinc-800 bg-black/20"
          />
          <a
            href={policyHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm text-accent-info underline underline-offset-4"
          >
            {t('privacy.openStandalone')}
          </a>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;
