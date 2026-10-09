import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HexRadarChart from '../radar/HexRadarChart';
import HomeDiagnosticsPanel from './HomeDiagnosticsPanel';
import HomeResonanceOverlay from './HomeResonanceOverlay';
import { SIX_AXIS_METRICS, type ScoreMetric, type SixAxisMetric } from '../../types/scoring';
import { useCoreSixRadar } from '../../hooks/useCoreSixRadar';
import { useHomeResonanceRitual } from '../../hooks/useHomeResonanceRitual';
import { formatOverallResonanceScore } from '../../logic/core/scoring';
import { resolveVehicleClass } from '../../logic/core/vehicleResolver';
import { getAxisMeaningI18nPrefix } from '../../logic/core/scoreMeaningCatalog';
import LeaderboardSyncAllBar from '../ladder/LeaderboardSyncAllBar';
import { loadPhysicalProfile, subscribePhysicalProfile } from '../../services/localStorageService';
import type { PhysicalProfile } from '../../types/userProfile';
import { ONBOARDING_RADAR_TARGET_ID } from '../../constants/onboardingTargets';
import { resolveSixAxisChartLabel } from '../../i18n/resolveSixAxisChartLabel';
import { SixAxisDataGridLabel } from '../radar/SixAxisDataGridLabel';
import { RADAR_CARD_V2 } from '../radar/radarVisualTokens';
import { useShellInteractionBlocked } from '../../stores/uiInteractionStore';
import { cn } from '../../lib/cn';

/** Fixed mobile HUD density — 375–430 stays two columns inside the inset panel. */
const AXIS_HUD_COLS = 2;

/**
 * Console instrument cluster as one `ui-card` — same shell language as body / ladder home cards.
 * WHY: Borderless bleed felt floating against Pro + profile cards; one cabin restores cohesion.
 */
export const HomeRadarBoard: FC = () => {
  const { t } = useTranslation('common');
  const { radarPoints, overallScore, scaleMax } = useCoreSixRadar();
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
        label: resolveSixAxisChartLabel(t, point.key as SixAxisMetric),
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

  const ritualFade = `transition-opacity duration-300 motion-reduce:transition-none ${
    ritualOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
  }`;

  return (
    <>
      <section
        className={`ui-card relative overflow-hidden ${isBlocking ? 'pointer-events-none select-none' : ''}`}
        aria-busy={isBlocking}
      >
        {/* WHY: Scan grid stays clipped inside the card — never bleeds onto the shell background. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_24px),repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_24px)]"
          style={{ opacity: RADAR_CARD_V2.opacity.gridOverlay }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent"
          aria-hidden
        />

        <div className="relative">
          <p className="mb-1 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-accent-primary/90">
            {t('home.consoleKicker', { ns: 'common' })}
          </p>
          <h2 className="text-center font-semibold tracking-tight text-zinc-100">
            {t('home.radarOverview', { ns: 'common' })}
          </h2>

          <div className="mt-3 flex flex-col items-center gap-3">
            {/* 1. Radar */}
            <div
              id={ONBOARDING_RADAR_TARGET_ID}
              className={`w-full ${ritualFade}`}
              aria-hidden={ritualOpen}
            >
              <HexRadarChart
                points={localizedRadarPoints}
                scaleMax={scaleMax}
                className="mx-auto aspect-square w-full max-w-[260px] shrink-0"
                aria-label={t('home.radarAria', { ns: 'common' })}
              />
            </div>

            {/* 2. Overall → 3. Six-axis HUD → 4. Diagnostics CTA */}
            <div className={`w-full space-y-2.5 ${ritualFade}`} aria-hidden={ritualOpen}>
              <div className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                  {t('home.overallAverage', { ns: 'common' })}
                </p>
                <p className="mt-1 font-mono text-5xl font-semibold tabular-nums text-accent-info drop-shadow-[0_0_18px_rgba(34,211,238,0.35)] sm:text-6xl">
                  {formatOverallResonanceScore(overallScore)}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800/40 bg-zinc-950/60 p-3">
                <ul className="grid grid-cols-2 text-[11px]">
                  {SIX_AXIS_METRICS.map((key, index) => {
                    const isLastRow = index >= SIX_AXIS_METRICS.length - AXIS_HUD_COLS;
                    const isEndCol = index % AXIS_HUD_COLS === AXIS_HUD_COLS - 1;
                    return (
                      <li
                        key={key}
                        className={cn(
                          'px-2 py-2 text-center text-zinc-400',
                          !isEndCol && 'border-r border-zinc-800/40',
                          !isLastRow && 'border-b border-zinc-800/40'
                        )}
                      >
                        <SixAxisDataGridLabel metric={key} className="justify-center" />
                        <span
                          title={t(`${getAxisMeaningI18nPrefix(key)}.desc`, { ns: 'common' })}
                          className={cn(
                            'mt-0.5 block font-mono text-sm font-semibold tabular-nums',
                            (valueByKey[key] ?? 0) > 100
                              ? 'text-accent-info drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                              : 'text-zinc-100'
                          )}
                        >
                          {valueByKey[key] ?? 0}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <HomeDiagnosticsPanel
                disabled={isBlocking}
                onStartDiagnostics={() => {
                  void startRitual();
                }}
              />
            </div>

            {/* 5. Ladder sync — secondary footer inside the same cabin */}
            <div className={`w-full border-t border-zinc-800/60 pt-2.5 ${ritualFade}`} aria-hidden={ritualOpen}>
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
