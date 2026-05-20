import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface ContactPageProps {
  onBack?: () => void;
}

const ContactPage: FC<ContactPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const supportEmail = t('contact.supportEmail');

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <div className="ui-shell relative max-w-3xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-info">
              {t('contact.kicker')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('contact.title')}</h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              {t('contact.subtitle')}
            </p>
          </div>
          {onBack ? (
            <button type="button" className="ui-btn shrink-0" onClick={onBack}>
              {t('back')}
            </button>
          ) : null}
        </header>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
            {t('contact.emailTitle')}
          </h2>
          <p className="text-sm text-zinc-300">{supportEmail}</p>
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex text-sm text-accent-info underline underline-offset-4"
          >
            {t('contact.sendEmail')}
          </a>
          <p className="text-xs text-zinc-500">{t('contact.responseSla')}</p>
        </section>
      </div>
    </main>
  );
};

export default ContactPage;
