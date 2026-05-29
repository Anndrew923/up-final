import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

const JoinArenaComparisonTable: FC = () => {
  const { t } = useTranslation('arena');

  return (
    <section
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-800/80 shadow-panel"
      aria-label={t('compareTitle')}
    >
      <div className="flex flex-col bg-bg-card/95 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
            {t('compareCoreLabel')}
          </h2>
          <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
            {t('compareCoreBadge')}
          </span>
        </div>
        <ul className="space-y-2.5 text-xs leading-relaxed text-pretty text-zinc-400">
          <li className="flex gap-2">
            <span className="text-emerald-400/90" aria-hidden>
              ✓
            </span>
            <span className="break-words">{t('compareCoreAssessment')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400/90" aria-hidden>
              ✓
            </span>
            <span className="break-words">{t('compareCoreRadar')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400/90" aria-hidden>
              ✓
            </span>
            <span className="break-words">{t('compareCoreHistory')}</span>
          </li>
        </ul>
      </div>

      <div className="relative flex flex-col overflow-hidden bg-gradient-to-br from-zinc-950 via-bg-card/95 to-accent-primary/5 p-4 backdrop-blur-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,140,0,0.12),transparent_55%)]"
          aria-hidden
        />
        <div className="relative mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-accent-primary">
            {t('compareProLabel')}
          </h2>
          <span className="shrink-0 rounded-full border border-accent-primary/50 bg-accent-primary/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-primary">
            {t('compareProBadge')}
          </span>
        </div>
        <ul className="relative space-y-2.5 text-xs leading-relaxed text-pretty text-zinc-200">
          <li className="flex gap-2">
            <span className="text-accent-primary" aria-hidden>
              ◆
            </span>
            <span className="break-words">{t('compareProLeaderboard')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent-info" aria-hidden>
              ◆
            </span>
            <span className="break-words">{t('compareProCloudSync')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-300" aria-hidden>
              ◆
            </span>
            <span className="break-words">{t('compareProStrategy')}</span>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default JoinArenaComparisonTable;
