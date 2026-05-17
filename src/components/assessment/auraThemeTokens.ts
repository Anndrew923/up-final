import type { PerformanceAuraKey } from '../../logic/core/performanceAura';

export interface AuraThemeTokens {
  borderGradient: string;
  glow: string;
  shimmer: string;
  text: string;
}

export const AURA_THEME: Record<PerformanceAuraKey, AuraThemeTokens> = {
  none: {
    borderGradient: 'from-zinc-600/40 via-zinc-500/20 to-zinc-600/40',
    glow: 'bg-zinc-500/10',
    shimmer: '',
    text: 'text-zinc-300',
  },
  pulse: {
    borderGradient: 'from-emerald-500/10 via-emerald-400/55 to-emerald-500/10',
    glow: 'bg-emerald-500/12',
    shimmer: 'animate-aura-pulse',
    text: 'text-emerald-300',
  },
  flow: {
    borderGradient: 'from-sky-500/10 via-sky-400/55 to-cyan-500/10',
    glow: 'bg-sky-500/12',
    shimmer: 'animate-aura-flow',
    text: 'text-sky-300',
  },
  shimmer: {
    borderGradient: 'from-purple-500/15 via-fuchsia-400/65 to-violet-500/15',
    glow: 'bg-purple-500/15',
    shimmer: 'animate-aura-shimmer',
    text: 'text-purple-300',
  },
  lightning: {
    borderGradient: 'from-red-500/15 via-orange-400/60 to-cyan-400/40',
    glow: 'bg-red-500/12',
    shimmer: 'animate-aura-lightning',
    text: 'text-orange-300',
  },
  void_flame: {
    borderGradient: 'from-violet-900/40 via-orange-500/50 to-fuchsia-700/35',
    glow: 'bg-violet-600/14',
    shimmer: 'animate-aura-void',
    text: 'text-violet-200',
  },
  divine_light: {
    borderGradient: 'from-amber-200/30 via-yellow-100/70 to-amber-300/30',
    glow: 'bg-amber-400/18',
    shimmer: 'animate-aura-divine',
    text: 'text-amber-200',
  },
};
