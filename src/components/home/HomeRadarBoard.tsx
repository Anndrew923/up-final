import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import HexRadarChart from '../radar/HexRadarChart';
import { SIX_AXIS_COUNT, SIX_AXIS_METRICS, type ScoreMetric } from '../../types/scoring';
import { useCoreSixRadar } from '../../hooks/useCoreSixRadar';

/**
 * Fitness-style console slice: radar card + overall — data via `useCoreSixRadar` only.
 */
export const HomeRadarBoard: FC = () => {
  const { t } = useTranslation();
  const { radarPoints, overallScore, scaleMax, completionCount } = useCoreSixRadar();

  const valueByKey = useMemo(() => {
    const m: Partial<Record<ScoreMetric, number>> = {};
    for (const p of radarPoints) {
      m[p.key] = p.value;
    }
    return m;
  }, [radarPoints]);

  return (
    <section className="relative overflow-hidden rounded-xl border border-accent-primary/35 bg-bg-card shadow-panel">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
      <div className="pointer-events-none absolute left-3 top-3 h-8 w-8 rounded-tl-lg border-l border-t border-accent-primary/40" />
      <div className="pointer-events-none absolute right-3 top-3 h-8 w-8 rounded-tr-lg border-r border-t border-accent-primary/40" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 rounded-bl-lg border-b border-l border-accent-primary/40" />
      <div className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 rounded-br-lg border-b border-r border-accent-primary/40" />

      <div className="relative px-4 pb-5 pt-7 md:px-6">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-accent-primary/90">
          {t('home.consoleKicker', { ns: 'common' })}
        </p>
        <h2 className="font-semibold tracking-tight text-zinc-100">
          {t('home.radarOverview', { ns: 'common' })}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          {t('home.radarCompletion', {
            ns: 'common',
            count: completionCount,
            total: SIX_AXIS_COUNT,
          })}
        </p>

        <div className="mt-6 flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
          <HexRadarChart
            points={radarPoints}
            scaleMax={scaleMax}
            className="mx-auto h-64 w-full max-w-[280px] shrink-0 md:mx-0"
            aria-label={t('home.radarAria', { ns: 'common' })}
          />

          <div className="flex w-full flex-1 flex-col gap-4 md:max-w-md">
            <div className="rounded-lg border border-zinc-800 bg-bg-panel/90 px-4 py-3 text-center md:text-left">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {t('home.overallAverage', { ns: 'common' })}
              </p>
              <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-accent-info">
                {overallScore}
              </p>
              <p className="mt-2 text-[11px] leading-snug text-zinc-500">
                {t('home.overallFormula', { ns: 'common' })}
              </p>
            </div>

            <ul className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
              {SIX_AXIS_METRICS.map((key) => (
                <li
                  key={key}
                  className="rounded-md border border-zinc-800/80 bg-bg-panel/60 px-2 py-1.5 text-zinc-400"
                >
                  <span className="block truncate text-[10px] uppercase tracking-wide text-zinc-500">
                    {t(`home.radar.axis.${key}`, { ns: 'common' })}
                  </span>
                  <span className="font-mono tabular-nums text-zinc-200">
                    {valueByKey[key] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeRadarBoard;
