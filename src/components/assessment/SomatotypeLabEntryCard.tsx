import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

/**
 * Assessment-lobby portal into the somatotype lab.
 * WHY: Inclusive “all-gender” acquisition CTA on the Dyno assessment page —
 * cold geometric chrome, no hardcore / ladder coupling.
 */
export const SomatotypeLabEntryCard: FC = () => {
  const { t } = useTranslation('common');
  const title = t('tools.somatotypeLab.entry.title');

  return (
    <Link
      to={ROUTES.somatotypeLab}
      aria-label={title}
      className="group relative block overflow-hidden border border-zinc-700/90 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-black p-4 transition-colors hover:border-zinc-500/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 sm:p-5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-zinc-500/70 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-3 h-8 w-px bg-zinc-600/80 transition-colors group-hover:bg-zinc-400/80"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 size-3 border-b border-r border-zinc-600/70 transition-colors group-hover:border-zinc-400/80"
      />

      <div className="space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
          {t('tools.somatotypeLab.kicker')}
        </p>
        <h2 className="text-sm font-semibold tracking-tight text-zinc-100 sm:text-base">{title}</h2>
        <p className="text-[11px] leading-relaxed text-zinc-400 sm:text-xs">
          {t('tools.somatotypeLab.entry.subtitle')}
        </p>
      </div>
    </Link>
  );
};

export default SomatotypeLabEntryCard;
