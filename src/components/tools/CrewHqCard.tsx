import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../config/routes';
import { useCrewGuild } from '../../hooks/useCrewGuild';

/**
 * Garage entry card → `/crew` (Crew HQ).
 * WHY: Keep 5-tab chrome unchanged; HQ lives as a tools sub-surface with crest-tier presence.
 */
const CrewHqCard: FC = () => {
  const { t } = useTranslation('common');
  const { status, guild } = useCrewGuild();
  const joined = status === 'ready' && guild != null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-400/35 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 p-5 shadow-[0_0_32px_rgba(34,211,238,0.08),0_0_48px_rgba(245,158,11,0.06)] backdrop-blur sm:p-6">
      {/* Dual-rim glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-amber-400/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-cyan-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-500/12 blur-3xl"
        aria-hidden
      />

      <header className="relative flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-b from-cyan-500/20 to-amber-500/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            <path
              d="M12 3 5 6v5.2c0 4.4 2.9 7.8 7 8.8 4.1-1 7-4.4 7-8.8V6l-7-3Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M12 8.2v7.2M9.2 11.2h5.6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/85">
            {t('crew.hq.code')}
          </p>
          <h2 className="truncate text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
            {joined ? guild.name : t('crew.hq.title')}
          </h2>
          {joined ? (
            <p className="font-mono text-xs tracking-wide text-amber-200/80">
              {t('crew.hq.subtitleJoined', { tag: guild.tag })}
            </p>
          ) : null}
        </div>
      </header>

      <div className="relative mt-5">
        <Link
          to={ROUTES.crew}
          aria-label={t('crew.hq.openAria')}
          className="ui-btn ui-btn-primary group/cta inline-flex w-full items-center justify-center gap-2 shadow-[0_0_24px_rgba(34,211,238,0.2)] transition duration-200 hover:shadow-[0_0_32px_rgba(34,211,238,0.35)] sm:w-auto"
        >
          <span>{t('crew.hq.enter')}</span>
          <span
            className="inline-block transition-transform duration-200 group-hover/cta:translate-x-1"
            aria-hidden
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
};

export default CrewHqCard;
