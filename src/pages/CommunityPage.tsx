import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';

/**
 * High-fidelity placeholder — routes are real; full community features are a later slice.
 */
export default function CommunityPage() {
  const { t } = useTranslation();

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden>
        <div className="ui-recon-backdrop absolute inset-0" />
      </div>

      <div className="ui-shell relative max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-info">
            {t('community.kicker', { ns: 'common' })}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            {t('community.title', { ns: 'common' })}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
            {t('community.subtitle', { ns: 'common' })}
          </p>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-bg-card/90 p-8 shadow-panel backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent-primary/40 bg-accent-primary/10 font-mono text-xs text-accent-primary">
                Σ
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  {t('community.card1Title', { ns: 'common' })}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {t('community.card1Body', { ns: 'common' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 border-t border-zinc-800/90 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent-info/40 bg-accent-info/10 font-mono text-xs text-accent-info">
                ◆
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  {t('community.card2Title', { ns: 'common' })}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {t('community.card2Body', { ns: 'common' })}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link to={ROUTES.home} className="ui-btn ui-btn-primary inline-flex">
            {t('community.ctaHome', { ns: 'common' })}
          </Link>
          <Link
            to={ROUTES.ladder}
            className="ui-btn inline-flex border-accent-info/40 text-accent-info hover:bg-accent-info/10"
          >
            {t('community.ctaArena', { ns: 'common' })}
          </Link>
        </div>
      </div>
    </main>
  );
}
