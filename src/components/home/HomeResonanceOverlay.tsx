import { useEffect, type CSSProperties, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import HexRadarChart from '../radar/HexRadarChart';
import { AURA_THEME, auraNeonCssVars } from '../assessment/auraThemeTokens';
import { resolveAuraFromBandId } from '../../logic/core/performanceAura';
import { formatOverallResonanceScore } from '../../logic/core/scoring';
import type { HomeResonancePhase, HomeResonanceSnapshot } from '../../types/homeResonance';
import {
  resolveHomeResonancePhase,
  resolveHomeSectionString,
} from '../../i18n/resolveHomeBundleCopy';
import HomeDiagnosticsReportPanel from './HomeDiagnosticsReportPanel';

export interface HomeResonanceOverlayProps {
  open: boolean;
  phase: HomeResonancePhase;
  ritualFill: number;
  displayScore: number | null;
  showBootScore: boolean;
  typedGradeLine: string;
  snapshot: HomeResonanceSnapshot | null;
  scaleMax: number;
  onClose: () => void;
}

/** Fixed vertical slots — prevents typewriter / phase copy from shifting the CTA. */
const GRADE_SLOT_MIN_H = 'min-h-[96px] sm:min-h-[120px]';
const CTA_SLOT_H = 'h-11 sm:h-12';

const HomeResonanceOverlay: FC<HomeResonanceOverlayProps> = ({
  open,
  phase,
  ritualFill,
  displayScore,
  showBootScore,
  typedGradeLine,
  snapshot,
  scaleMax,
  onClose,
}) => {
  const { t } = useTranslation('common');
  const overlayAria = resolveHomeSectionString(t, 'resonance', 'overlayAria');
  const reportTitle = resolveHomeSectionString(t, 'resonance', 'reportTitle');
  const resonanceKicker = resolveHomeSectionString(t, 'resonance', 'kicker');
  const bootScoreLabel = resolveHomeSectionString(t, 'resonance', 'bootScore');
  const gradeKickerLabel = resolveHomeSectionString(t, 'overallGrade', 'kicker');

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !snapshot) return null;

  const isReport = phase === 'report';
  const auraKey = resolveAuraFromBandId(snapshot.gradeBandId);
  const theme = AURA_THEME[auraKey];
  const neonStyle = auraNeonCssVars(theme.neonRgb) as CSSProperties;
  const showReveal = phase === 'reveal';
  const scoreLabel = showBootScore
    ? bootScoreLabel
    : formatOverallResonanceScore(displayScore);
  const glowOpacity = phase === 'boot' ? 0.35 : 0.85;
  const gridFadeOpacity = phase === 'boot' ? 0.15 + ritualFill * 0.85 : 1;
  const phaseLine =
    phase === 'reveal'
      ? typedGradeLine.length === 0
        ? resolveHomeResonancePhase(t, 'reveal')
        : ''
      : resolveHomeResonancePhase(t, phase);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] isolate flex flex-col overflow-y-auto overscroll-y-contain pointer-events-auto px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
      role="dialog"
      aria-modal="true"
      aria-label={isReport ? reportTitle : overlayAria}
    >
      <div
        className="pointer-events-auto absolute inset-0 bg-black/90 motion-safe:transition-opacity motion-safe:duration-300"
        aria-hidden
      />

      <div
        className="relative z-10 my-auto w-full max-w-lg shrink-0 overflow-visible pointer-events-auto"
        style={neonStyle}
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-[0.05]"
          aria-hidden
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,rgba(255,255,255,0.55)_0_1px,transparent_1px_22px),repeating-linear-gradient(90deg,rgba(255,255,255,0.55)_0_1px,transparent_1px_22px)',
          }}
        />

        <div className="relative overflow-visible rounded-2xl border border-accent-primary/40 bg-zinc-950/[0.97] shadow-[0_0_80px_rgba(0,0,0,0.75),0_0_48px_rgb(var(--aura-neon-rgb)/0.22),inset_0_1px_0_rgba(56,189,248,0.25)]">
          {isReport ? (
            <div className="relative flex flex-col px-5 pb-4 pt-5 sm:px-8 sm:pb-6 sm:pt-8">
              <HomeDiagnosticsReportPanel snapshot={snapshot} onClose={onClose} />
            </div>
          ) : (
            <div className="relative flex flex-col px-5 pb-4 pt-5 sm:px-8 sm:pb-6 sm:pt-8">
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.28em] text-accent-primary/90">
                {resonanceKicker}
              </p>
              <p className="mt-1 text-center text-xs text-zinc-500">{snapshot.archetypeTitle}</p>

              <div className="relative mx-auto mt-3 aspect-square w-full max-w-[min(280px,100%)] shrink-0 overflow-visible px-1 sm:mt-5 md:mt-6">
                <div
                  className={`pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full ${theme.diffusedRadial} motion-reduce:opacity-50 motion-safe:transition-opacity motion-safe:duration-500`}
                  style={{ filter: 'blur(25px)', opacity: glowOpacity }}
                  aria-hidden
                />
                <HexRadarChart
                  points={snapshot.radarPoints}
                  scaleMax={scaleMax}
                  ritualFill={ritualFill}
                  suppressEntryAnimation
                  gridFadeOpacity={gridFadeOpacity}
                  className="relative z-10 size-full origin-center scale-[0.94] sm:scale-100"
                  aria-label={t('home.radarAria')}
                />
              </div>

              <div className="mt-3 h-[72px] shrink-0 overflow-visible text-center sm:mt-5 sm:h-[96px]">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                  {t('home.overallAverage')}
                </p>
                <p
                  className={`mt-1.5 font-mono text-4xl font-semibold tabular-nums motion-reduce:animate-none sm:mt-2 sm:text-5xl ${
                    showBootScore ? 'motion-safe:animate-pulse text-zinc-500' : theme.text
                  }`}
                  style={
                    showBootScore
                      ? undefined
                      : {
                          textShadow:
                            '0 0 14px rgb(var(--aura-neon-rgb) / 0.9), 0 0 32px rgb(var(--aura-neon-rgb) / 0.5)',
                        }
                  }
                >
                  {scoreLabel}
                </p>
              </div>

              <div className="mt-3 shrink-0 border-t border-zinc-800/80 pt-4 sm:mt-4 sm:pt-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                  {gradeKickerLabel}
                </p>

                <div className={`relative mt-3 ${GRADE_SLOT_MIN_H} overflow-visible`}>
                  {showReveal ? (
                    <>
                      <p className="invisible whitespace-pre-line text-sm leading-relaxed" aria-hidden>
                        {snapshot.gradeLine}
                      </p>
                      <p
                        className={`absolute inset-0 whitespace-pre-line text-sm leading-relaxed ${theme.text}`}
                        style={{
                          textShadow:
                            '0 0 12px rgb(var(--aura-neon-rgb) / 0.8), 0 0 26px rgb(var(--aura-neon-rgb) / 0.4)',
                        }}
                      >
                        {typedGradeLine}
                      </p>
                    </>
                  ) : (
                    <p
                      className={`flex ${GRADE_SLOT_MIN_H} items-center justify-center text-center font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500`}
                    >
                      {phaseLine}
                    </p>
                  )}
                </div>

                <div className={`mt-3 sm:mt-5 ${CTA_SLOT_H} shrink-0`} aria-hidden>
                  <span className="block h-full w-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HomeResonanceOverlay;
