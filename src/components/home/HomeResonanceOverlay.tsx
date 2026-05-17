import { useEffect, type CSSProperties, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import HexRadarChart from '../radar/HexRadarChart';
import { AURA_THEME, auraNeonCssVars } from '../assessment/auraThemeTokens';
import { resolveAuraFromBandId } from '../../logic/core/performanceAura';
import { formatOverallResonanceScore } from '../../logic/core/scoring';
import type { HomeResonancePhase, HomeResonanceSnapshot } from '../../types/homeResonance';

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
const GRADE_SLOT_MIN_H = 'min-h-[140px]';
const CTA_SLOT_H = 'h-12';

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !snapshot) return null;

  const auraKey = resolveAuraFromBandId(snapshot.gradeBandId);
  const theme = AURA_THEME[auraKey];
  const neonStyle = auraNeonCssVars(theme.neonRgb) as CSSProperties;
  const showReveal = phase === 'reveal';
  const scoreLabel = showBootScore
    ? t('home.resonance.bootScore')
    : formatOverallResonanceScore(displayScore);
  const glowOpacity = phase === 'boot' ? 0.35 : 0.85;
  const gridFadeOpacity = phase === 'boot' ? 0.15 + ritualFill * 0.85 : 1;
  const phaseLine = t(`home.resonance.phase.${phase}`);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label={t('home.resonance.overlayAria')}
    >
      {/* Full-viewport scrim — blocks Home, BottomNav, and HUD hit targets */}
      <div
        className="pointer-events-auto absolute inset-0 bg-black/90 motion-safe:transition-opacity motion-safe:duration-300"
        aria-hidden
      />

      <div
        className="relative z-10 w-full max-w-lg overflow-visible pointer-events-auto"
        style={neonStyle}
      >
        {/* Clipped blueprint texture only — glows stay overflow-visible outside */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-[0.05]"
          aria-hidden
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,rgba(255,255,255,0.55)_0_1px,transparent_1px_22px),repeating-linear-gradient(90deg,rgba(255,255,255,0.55)_0_1px,transparent_1px_22px)',
          }}
        />

        <div className="relative overflow-visible rounded-2xl border border-accent-primary/40 bg-zinc-950/[0.97] shadow-[0_0_80px_rgba(0,0,0,0.75),0_0_48px_rgb(var(--aura-neon-rgb)/0.22),inset_0_1px_0_rgba(56,189,248,0.25)]">
          <div className="relative flex flex-col px-5 pb-6 pt-8 sm:px-8">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.28em] text-accent-primary/90">
              {t('home.resonance.kicker')}
            </p>
            <p className="mt-1 text-center text-xs text-zinc-500">{snapshot.archetypeTitle}</p>

            <div className="relative mx-auto mt-6 h-[280px] w-full max-w-[280px] shrink-0 overflow-visible">
              <div
                className={`pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full ${theme.diffusedRadial} motion-reduce:opacity-50 motion-safe:transition-opacity motion-safe:duration-500`}
                style={{ filter: 'blur(25px)', opacity: glowOpacity }}
                aria-hidden
              />
              <HexRadarChart
                points={snapshot.radarPoints}
                scaleMax={scaleMax}
                ritualFill={ritualFill}
                suppressEntryAnimation
                gridFadeOpacity={gridFadeOpacity}
                className="relative z-10 mx-auto h-full w-full max-w-[280px]"
                aria-label={t('home.radarAria')}
              />
            </div>

            <div className="mt-6 h-[96px] shrink-0 overflow-visible text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                {t('home.overallAverage')}
              </p>
              <p
                className={`mt-2 font-mono text-5xl font-semibold tabular-nums motion-reduce:animate-none ${
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

            <div className="mt-4 shrink-0 border-t border-zinc-800/80 pt-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                {t('home.overallGrade.kicker')}
              </p>

              <div className={`relative mt-3 ${GRADE_SLOT_MIN_H} overflow-visible`}>
                {showReveal ? (
                  <>
                    <p className="invisible text-sm leading-relaxed" aria-hidden>
                      {snapshot.gradeLine}
                    </p>
                    <p
                      className={`absolute inset-0 text-sm leading-relaxed ${theme.text}`}
                      style={{
                        textShadow:
                          '0 0 12px rgb(var(--aura-neon-rgb) / 0.8), 0 0 26px rgb(var(--aura-neon-rgb) / 0.4)',
                      }}
                    >
                      {typedGradeLine}
                    </p>
                  </>
                ) : (
                  <p className="flex min-h-[140px] items-center justify-center text-center font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    {phaseLine}
                  </p>
                )}
              </div>

              <div className={`mt-5 ${CTA_SLOT_H} shrink-0`}>
                {showReveal ? (
                  <button type="button" className="ui-btn ui-btn-primary h-full w-full" onClick={onClose}>
                    {t('home.resonance.close')}
                  </button>
                ) : (
                  <span className="block h-full w-full" aria-hidden />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default HomeResonanceOverlay;
