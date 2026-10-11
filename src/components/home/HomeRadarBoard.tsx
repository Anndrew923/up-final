import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HexRadarChart from '../radar/HexRadarChart';
import HomeDiagnosticsPanel from './HomeDiagnosticsPanel';
import HomeResonanceOverlay from './HomeResonanceOverlay';
import ConsoleAxisViewToggle from './ConsoleAxisViewToggle';
import ConsoleSheenLayer from './ConsoleSheenLayer';
import { SIX_AXIS_METRICS, type ScoreMetric, type SixAxisMetric } from '../../types/scoring';
import { useConsoleAxisViewMode } from '../../hooks/useConsoleAxisViewMode';
import { useCoreSixRadar } from '../../hooks/useCoreSixRadar';
import { useHomeResonanceRitual } from '../../hooks/useHomeResonanceRitual';
import { formatConsoleAxisHudValue } from '../../logic/core/consoleAxisViewMode';
import { formatOverallResonanceScore } from '../../logic/core/scoring';
import { resolveVehicleClass } from '../../logic/core/vehicleResolver';
import { getAxisMeaningI18nPrefix } from '../../logic/core/scoreMeaningCatalog';
import LeaderboardSyncAllBar from '../ladder/LeaderboardSyncAllBar';
import {
  loadPhysicalProfile,
  subscribePhysicalProfile,
} from '../../services/localStorageService';
import type { PhysicalProfile } from '../../types/userProfile';
import { ONBOARDING_RADAR_TARGET_ID } from '../../constants/onboardingTargets';
import {
  resolveConsoleOverallAverageLabel,
  resolveConsoleRadarVertexLabel,
} from '../../i18n/resolveConsoleAxisViewLabels';
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
  const { viewMode, isSurging, setViewMode } = useConsoleAxisViewMode();
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
        label: resolveConsoleRadarVertexLabel(t, point.key as SixAxisMetric, viewMode),
      })),
    [radarPoints, t, viewMode]
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
          {/*
            WHY 1fr_auto_1fr: title sits on the true horizontal midline (same axis as kicker + radar),
            while the pill docks to the trailing 1fr — 2-col [1fr_auto] was shoving the h2 left.
          */}
          <div
            data-testid="console-title-row"
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
          >
            {/* Mirror trailing track so the auto title column stays on the card midline. */}
            <span aria-hidden className="min-w-0" />
            <h2 className="justify-self-center text-center font-semibold tracking-tight text-zinc-100">
              {t('home.radarOverview', { ns: 'common' })}
            </h2>
            {/* WHY min-w-0: shrink-0 pill must not inflate the trailing 1fr past the card edge. */}
            <div className="flex min-w-0 justify-end">
              <ConsoleAxisViewToggle
                value={viewMode}
                onChange={setViewMode}
                disabled={isBlocking || ritualOpen}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col items-center gap-3">
            {/* 1. Radar — S-Mode recalibrate / ambience live on the shell only (SVG math untouched). */}
            <div
              id={ONBOARDING_RADAR_TARGET_ID}
              data-console-mode={viewMode}
              className={cn(
                'ui-console-radar-stage ui-console-telemetry-surge w-full rounded-2xl',
                ritualFade,
                isSurging && 'is-surging'
              )}
              aria-hidden={ritualOpen}
            >
              <div className="ui-console-radar-aura" aria-hidden />
              <ConsoleSheenLayer />
              <div
                className={cn(
                  'ui-console-radar-pulse mx-auto w-full max-w-[260px]',
                  isSurging && 'is-pulsing'
                )}
              >
                <div key={`radar-${viewMode}`} className="ui-console-lexicon-fade">
                  <HexRadarChart
                    points={localizedRadarPoints}
                    scaleMax={scaleMax}
                    className="aspect-square w-full shrink-0"
                    aria-label={t('home.radarAria', { ns: 'common' })}
                  />
                </div>
              </div>
            </div>

            {/* 2. Overall → 3. Six-axis HUD → 4. Diagnostics CTA */}
            <div className={`w-full space-y-2.5 ${ritualFade}`} aria-hidden={ritualOpen}>
              {/* WHY no ui-console-telemetry-surge: border flash needs a bordered shell; sheen uses .is-surging alone. */}
              <div
                className={cn(
                  'ui-console-rev-up relative text-center',
                  isSurging && 'is-surging is-revving'
                )}
              >
                <ConsoleSheenLayer />
                <div
                  key={`overall-${viewMode}`}
                  className="ui-console-lexicon-fade relative z-[1]"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    {resolveConsoleOverallAverageLabel(t, viewMode)}
                  </p>
                  <p className="mt-1 font-mono text-5xl font-semibold tabular-nums text-accent-info drop-shadow-[0_0_18px_rgba(34,211,238,0.35)] sm:text-6xl">
                    {formatOverallResonanceScore(overallScore)}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  'ui-console-telemetry-surge relative rounded-xl border border-zinc-800/40 bg-zinc-950/60 p-3',
                  isSurging && 'is-surging'
                )}
              >
                <ConsoleSheenLayer />
                <ul
                  key={`grid-${viewMode}`}
                  className="ui-console-lexicon-fade relative z-[1] grid grid-cols-2 text-[11px]"
                >
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
                        <SixAxisDataGridLabel
                          metric={key}
                          viewMode={viewMode}
                          className="items-center justify-center text-center"
                        />
                        <span
                          title={t(`${getAxisMeaningI18nPrefix(key)}.desc`, { ns: 'common' })}
                          className={cn(
                            'mt-0.5 block font-mono text-sm font-semibold tabular-nums',
                            (valueByKey[key] ?? 0) > 100
                              ? 'text-accent-info drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                              : 'text-zinc-100'
                          )}
                        >
                          {formatConsoleAxisHudValue(valueByKey[key] ?? 0)}
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
