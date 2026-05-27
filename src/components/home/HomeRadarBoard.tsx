import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HexRadarChart from '../radar/HexRadarChart';
import HomeDiagnosticsPanel from './HomeDiagnosticsPanel';
import HomeResonanceOverlay from './HomeResonanceOverlay';
import { SIX_AXIS_COUNT, SIX_AXIS_METRICS, type ScoreMetric } from '../../types/scoring';
import { useCoreSixRadar } from '../../hooks/useCoreSixRadar';
import { useHomeResonanceRitual } from '../../hooks/useHomeResonanceRitual';
import { formatOverallResonanceScore, getWeakestRadarAxis } from '../../logic/core/scoring';
import { resolveVehicleClass } from '../../logic/core/vehicleResolver';
import { getAxisMeaningI18nPrefix } from '../../logic/core/scoreMeaningCatalog';
import LeaderboardSyncAllBar from '../ladder/LeaderboardSyncAllBar';
import { loadPhysicalProfile, subscribePhysicalProfile } from '../../services/localStorageService';
import type { PhysicalProfile } from '../../types/userProfile';
import { ONBOARDING_RADAR_TARGET_ID } from '../../constants/onboardingTargets';
import { useShellInteractionBlocked } from '../../stores/uiInteractionStore';

/**
 * Fitness-style console slice: radar card + overall — data via `useCoreSixRadar` only.
 */
export const HomeRadarBoard: FC = () => {
  const { t } = useTranslation();
  const { radarPoints, overallScore, scaleMax, completionCount } = useCoreSixRadar();
  const [physicalProfile, setPhysicalProfile] = useState<PhysicalProfile | null>(() =>
    loadPhysicalProfile()
  );
  const isBlocking = useShellInteractionBlocked();

  useEffect(() => {
    const sync = () => setPhysicalProfile(loadPhysicalProfile());
    return subscribePhysicalProfile(sync);
  }, []);

  const localizedRadarPoints = useMemo(
    () =>
      radarPoints.map((point) => ({
        ...point,
        label: t(`home.radar.axis.${point.key}`, { ns: 'common' }),
      })),
    [radarPoints, t]
  );

  const valueByKey = useMemo(() => {
    const m: Partial<Record<ScoreMetric, number>> = {};
    for (const p of radarPoints) {
      m[p.key] = p.value;
    }
    return m;
  }, [radarPoints]);

  const weakest = useMemo(() => getWeakestRadarAxis(radarPoints), [radarPoints]);
  const vehicleClassId = useMemo(() => resolveVehicleClass(radarPoints), [radarPoints]);
  const genderGroup = useMemo(() => {
    if (physicalProfile?.gender === 'female') {
      return t('identity.genderGroup.female', { ns: 'common' });
    }
    return t('identity.genderGroup.male', { ns: 'common' });
  }, [physicalProfile?.gender, t]);

  const {
    open: ritualOpen,
    phase: ritualPhase,
    ritualFill,
    displayScore: ritualDisplayScore,
    showBootScore,
    typedGradeLine,
    snapshot: ritualSnapshot,
    startRitual,
    closeRitual,
  } = useHomeResonanceRitual({
    overallScore,
    radarPoints: localizedRadarPoints,
    vehicleClassId,
    genderGroup,
  });

  return (
    <>
      <section
        className={`relative overflow-hidden rounded-xl border border-accent-primary/35 bg-bg-card shadow-panel shadow-[inset_0_1px_0_rgba(56,189,248,0.14),inset_0_0_40px_rgba(59,130,246,0.07),0_0_34px_rgba(56,189,248,0.08)] motion-safe:transition-[box-shadow,border-color] motion-safe:duration-[480ms] ${isBlocking ? 'pointer-events-none select-none' : ''}`}
        aria-busy={isBlocking}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_20px),repeating-linear-gradient(90deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_20px)] opacity-[0.08]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
        <div className="pointer-events-none absolute left-3 top-3 h-8 w-8 rounded-tl-lg border-l border-t border-accent-primary/45" />
        <div className="pointer-events-none absolute right-3 top-3 h-8 w-8 rounded-tr-lg border-r border-t border-accent-primary/45" />
        <div className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 rounded-bl-lg border-b border-l border-accent-primary/45" />
        <div className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 rounded-br-lg border-b border-r border-accent-primary/45" />
        <div className="pointer-events-none absolute left-4 top-4 h-5 w-5 rounded-tl-md border-l border-t border-accent-info/50" />
        <div className="pointer-events-none absolute right-4 top-4 h-5 w-5 rounded-tr-md border-r border-t border-accent-info/50" />
        <div className="pointer-events-none absolute bottom-4 left-4 h-5 w-5 rounded-bl-md border-b border-l border-accent-info/50" />
        <div className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 rounded-br-md border-b border-r border-accent-info/50" />

        <div className="relative px-4 pb-6 pt-7 md:px-6">
          <p className="mb-1 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-accent-primary/90">
            {t('home.consoleKicker', { ns: 'common' })}
          </p>
          <h2 className="text-center font-semibold tracking-tight text-zinc-100">
            {t('home.radarOverview', { ns: 'common' })}
          </h2>
          <p className="mt-1 text-center text-xs text-zinc-500">
            {t('home.radarCompletion', {
              ns: 'common',
              count: completionCount,
              total: SIX_AXIS_COUNT,
            })}
          </p>

          <div className="mt-6 flex flex-col items-center gap-8">
            <div
              id={ONBOARDING_RADAR_TARGET_ID}
              className={`w-full transition-opacity duration-300 motion-reduce:transition-none ${
                ritualOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              aria-hidden={ritualOpen}
            >
              <HexRadarChart
                points={localizedRadarPoints}
                scaleMax={scaleMax}
                weakestKey={weakest?.key}
                className="mx-auto aspect-square w-full max-w-[280px] shrink-0"
                aria-label={t('home.radarAria', { ns: 'common' })}
              />

              <HomeDiagnosticsPanel
                disabled={isBlocking}
                onStartDiagnostics={() => {
                  void startRitual();
                }}
              />
            </div>

            <div
              className={`w-full max-w-md space-y-4 transition-opacity duration-300 motion-reduce:transition-none ${
                ritualOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              aria-hidden={ritualOpen}
            >
              <div className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                  {t('home.overallAverage', { ns: 'common' })}
                </p>
                <p className="mt-2 font-mono text-5xl font-semibold tabular-nums text-accent-info sm:text-6xl">
                  {formatOverallResonanceScore(overallScore)}
                </p>
              </div>

              <ul className="grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-3">
                {SIX_AXIS_METRICS.map((key) => (
                  <li
                    key={key}
                    className={`rounded-md border bg-bg-panel/40 px-2 py-1.5 text-center text-zinc-400 ${
                      weakest?.key === key
                        ? 'border-amber-300/50 shadow-[inset_2px_0_0_rgba(252,211,77,0.8)]'
                        : 'border-zinc-800/70'
                    }`}
                  >
                    <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      {t(`home.radar.axisCard.${key}`, {
                        ns: 'common',
                        defaultValue: t(`home.radar.axis.${key}`, { ns: 'common' }),
                      })}
                    </span>
                    <span
                      title={t(`${getAxisMeaningI18nPrefix(key)}.desc`, { ns: 'common' })}
                      className={`mt-0.5 block font-mono tabular-nums ${
                        (valueByKey[key] ?? 0) > 100 ? 'text-accent-info' : 'text-zinc-200'
                      }`}
                    >
                      {valueByKey[key] ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={`w-full border-t border-zinc-800/80 pt-2 transition-opacity duration-300 motion-reduce:transition-none ${
                ritualOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              aria-hidden={ritualOpen}
            >
              <LeaderboardSyncAllBar />
            </div>
          </div>
        </div>
      </section>

      <HomeResonanceOverlay
        open={ritualOpen}
        phase={ritualPhase}
        ritualFill={ritualFill}
        displayScore={ritualDisplayScore}
        showBootScore={showBootScore}
        typedGradeLine={typedGradeLine}
        snapshot={ritualSnapshot}
        scaleMax={scaleMax}
        onClose={closeRitual}
      />
    </>
  );
};

export default HomeRadarBoard;
