import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../config/routes';
import { useCrewGuild } from '../../hooks/useCrewGuild';

/**
 * Garage entry card → `/crew` (Crew HQ).
 * WHY: Keep 5-tab chrome unchanged; HQ lives as a tools sub-surface.
 */
const CrewHqCard: FC = () => {
  const { t } = useTranslation('common');
  const { status, guild } = useCrewGuild();
  const joined = status === 'ready' && guild != null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-bg-card to-slate-900 p-6 shadow-panel backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl" />

      <header className="space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-400/80">
          {t('crew.hq.code')}
        </p>
        <h2 className="text-lg font-bold tracking-tight text-zinc-50">{t('crew.hq.title')}</h2>
        <p className="text-sm text-zinc-400">
          {joined
            ? t('crew.hq.subtitleJoined', { tag: guild.tag, name: guild.name })
            : t('crew.hq.subtitleEmpty')}
        </p>
      </header>

      <div className="mt-5">
        <Link
          to={ROUTES.crew}
          aria-label={t('crew.hq.openAria')}
          className="ui-btn ui-btn-primary inline-flex w-full justify-center sm:w-auto"
        >
          {joined ? t('crew.hq.enter') : t('crew.hq.title')}
        </Link>
      </div>
    </section>
  );
};

export default CrewHqCard;
