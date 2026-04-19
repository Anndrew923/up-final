import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface JoinArenaPageProps {
  onSubscribe: () => void;
  onBack?: () => void;
}

const JoinArenaPage: FC<JoinArenaPageProps> = ({ onSubscribe, onBack }) => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-6 py-12 text-white">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-400">
          {t('proBadge', { ns: 'arena' })}
        </p>
        <h1 className="text-3xl font-semibold">{t('joinTitle', { ns: 'arena' })}</h1>
        <p className="text-sm text-zinc-300">{t('joinDescription', { ns: 'arena' })}</p>
      </header>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
        <ul className="space-y-2 text-sm text-zinc-200">
          <li>{t('proFeatureLeaderboard', { ns: 'arena' })}</li>
          <li>{t('proFeatureCloudSync', { ns: 'arena' })}</li>
        </ul>
      </section>
      <div className="flex gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
          >
            {t('back', { ns: 'common' })}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSubscribe}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-orange-400"
        >
          {t('subscribeNow', { ns: 'arena' })}
        </button>
      </div>
    </main>
  );
};

export default JoinArenaPage;
