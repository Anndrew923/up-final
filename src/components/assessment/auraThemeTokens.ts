import type { CSSProperties } from 'react';
import type { PerformanceAuraKey } from '../../logic/core/performanceAura';

/** Sets `--aura-neon-rgb` for `.text-aura-neon` / `.tachometer-fill-glow` utilities. */
export function auraNeonCssVars(neonRgb: string): CSSProperties {
  return { ['--aura-neon-rgb' as string]: neonRgb } as CSSProperties;
}

export interface AuraThemeTokens {
  borderGradient: string;
  glow: string;
  shimmer: string;
  text: string;
  /** RGB triplet for `rgb(var(--aura-neon-rgb) / α)` neon bloom */
  neonRgb: string;
  /** Radial bleed behind card — compositor-friendly (opacity + blur on layer) */
  diffusedRadial: string;
  /** Tachometer fill gradient */
  barFill: string;
}

export const AURA_THEME: Record<PerformanceAuraKey, AuraThemeTokens> = {
  none: {
    borderGradient: 'from-zinc-600/40 via-zinc-500/20 to-zinc-600/40',
    glow: 'bg-zinc-500/10',
    shimmer: '',
    text: 'text-zinc-300',
    neonRgb: '161 161 170',
    diffusedRadial:
      'bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(161,161,170,0.28)_0%,rgba(113,113,122,0.1)_48%,transparent_72%)]',
    barFill: 'bg-gradient-to-r from-zinc-500/70 via-zinc-400/80 to-zinc-500/70',
  },
  pulse: {
    borderGradient: 'from-emerald-500/10 via-emerald-400/55 to-emerald-500/10',
    glow: 'bg-emerald-500/12',
    shimmer: 'animate-aura-pulse',
    text: 'text-emerald-300',
    neonRgb: '52 211 153',
    diffusedRadial:
      'bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(52,211,153,0.42)_0%,rgba(16,185,129,0.14)_48%,transparent_72%)]',
    barFill: 'bg-gradient-to-r from-emerald-600/80 via-emerald-400/95 to-teal-400/90',
  },
  flow: {
    borderGradient: 'from-sky-500/10 via-sky-400/55 to-cyan-500/10',
    glow: 'bg-sky-500/12',
    shimmer: 'animate-aura-flow',
    text: 'text-sky-300',
    neonRgb: '56 189 248',
    diffusedRadial:
      'bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(56,189,248,0.42)_0%,rgba(14,165,233,0.14)_48%,transparent_72%)]',
    barFill: 'bg-gradient-to-r from-sky-600/80 via-sky-400/95 to-cyan-400/90',
  },
  shimmer: {
    borderGradient: 'from-purple-500/15 via-fuchsia-400/65 to-violet-500/15',
    glow: 'bg-purple-500/15',
    shimmer: 'animate-aura-shimmer',
    text: 'text-purple-300',
    neonRgb: '192 132 252',
    diffusedRadial:
      'bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(168,85,247,0.52)_0%,rgba(192,132,252,0.2)_45%,transparent_72%)]',
    barFill: 'bg-gradient-to-r from-violet-600/85 via-fuchsia-400/95 to-purple-400/90',
  },
  lightning: {
    borderGradient: 'from-red-500/15 via-orange-400/60 to-cyan-400/40',
    glow: 'bg-red-500/12',
    shimmer: 'animate-aura-lightning',
    text: 'text-orange-300',
    neonRgb: '251 146 60',
    diffusedRadial:
      'bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(251,146,60,0.48)_0%,rgba(248,113,113,0.16)_48%,transparent_72%)]',
    barFill: 'bg-gradient-to-r from-orange-600/85 via-amber-400/95 to-red-400/85',
  },
  void_flame: {
    borderGradient: 'from-violet-900/40 via-orange-500/50 to-fuchsia-700/35',
    glow: 'bg-violet-600/14',
    shimmer: 'animate-aura-void',
    text: 'text-violet-200',
    neonRgb: '167 139 250',
    diffusedRadial:
      'bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(139,92,246,0.5)_0%,rgba(249,115,22,0.18)_42%,transparent_72%)]',
    barFill: 'bg-gradient-to-r from-violet-700/90 via-fuchsia-500/95 to-orange-500/85',
  },
  divine_light: {
    borderGradient: 'from-amber-200/30 via-yellow-100/70 to-amber-300/30',
    glow: 'bg-amber-400/18',
    shimmer: 'animate-aura-divine',
    text: 'text-amber-200',
    neonRgb: '253 224 71',
    diffusedRadial:
      'bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(253,224,71,0.45)_0%,rgba(251,191,36,0.16)_48%,transparent_72%)]',
    barFill: 'bg-gradient-to-r from-amber-500/85 via-yellow-300/95 to-amber-200/90',
  },
};
