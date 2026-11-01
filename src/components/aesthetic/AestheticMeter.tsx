import { type CSSProperties, type FC } from 'react';
import { cn } from '../../lib/cn';
import { FOIL_NUMERAL_CLASS, FOIL_PLATE_CLASS } from './aestheticChrome';
import { CERT_BADGE_REVEAL_CLASS, CERT_NEEDLE_REVEAL_CLASS } from '../../lib/certRevealMotion';

export interface AestheticMeterProps {
  label: string;
  value: string;
  fillPct: number;
  showNeedle: boolean;
  badge: string | null;
  emphasize: boolean;
  staggerMs?: number;
}

export function clampMeterFill(score: number | null): number {
  if (score == null) return 0;
  return Math.min(100, Math.max(0, score));
}

/**
 * Caliper readout — hairline + micro ticks, not a HUD capsule.
 * WHY: `contents` lets four rows share one parent grid so an empty badge column collapses.
 * Needle rest pose is the final fill; revealing only overlays cert-needle on a full-width rail
 * so `translate3d(var(--fill), …)` is % of the track, not the 6px dot.
 */
const AestheticMeter: FC<AestheticMeterProps> = ({
  label,
  value,
  fillPct,
  showNeedle,
  badge,
  emphasize,
  staggerMs = 0,
}) => {
  const clamped = clampMeterFill(fillPct);

  return (
    <div className="contents">
      <p className="min-w-0 truncate text-[9px] tracking-[0.16em] text-zinc-400">{label}</p>
      <p
        className={cn(
          'min-w-[2.85rem] text-right text-[11px] font-semibold tabular-nums',
          emphasize ? FOIL_NUMERAL_CLASS : 'text-zinc-100'
        )}
      >
        {value}
      </p>
      {/* overflow-hidden: the GPU rail is full-track width, so translateX(fill%) must not paint into the badge cell. */}
      <div className="relative mx-0.5 h-3 min-w-0 overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-[#c9a227]/75 via-zinc-500/45 to-[#c9a227]/75" />
        <div className="absolute inset-x-0 top-[3px] bottom-[3px] opacity-55 [background-image:repeating-linear-gradient(90deg,rgba(201,162,39,0.55)_0_1px,transparent_1px_5px)]" />
        {showNeedle ? (
          <span
            className={cn(
              'pointer-events-none absolute inset-x-[3px] top-1/2 h-1.5',
              CERT_NEEDLE_REVEAL_CLASS
            )}
            style={
              {
                '--fill': `${clamped}%`,
                transform: 'translate3d(var(--fill), -50%, 0)',
                animationDelay: `${staggerMs}ms`,
              } as CSSProperties
            }
          >
            <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f3e6c8] shadow-[0_0_3px_rgba(201,162,39,0.35)]" />
          </span>
        ) : null}
      </div>
      {badge ? (
        <span className={cn(FOIL_PLATE_CLASS, CERT_BADGE_REVEAL_CLASS)}>{badge}</span>
      ) : (
        <span />
      )}
    </div>
  );
};

export default AestheticMeter;
