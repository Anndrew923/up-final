import { SIX_AXIS_METRICS, type SixAxisMetric } from '../types/scoring';

/**
 * Single source of truth for Core Six axis accent colors (WHY): Lobby status bars and radar
 * dominant palettes must share identical hue identity so dyno cards and Home radar read as one
 * instrument cluster — prevents purple/blue collisions and legacy drift between surfaces.
 */
export interface AxisAccentRgb {
  r: number;
  g: number;
  b: number;
}

export interface AxisAccentToken {
  lobbyBgClass: string;
  lobbyGlowRgba: string;
  stroke: string;
  reactorCore: string;
}

export interface AxisRadarPalette {
  auraStops: readonly [string, string, string];
  stroke: string;
  glow: string;
  reactorCore: string;
  reactorRing: string;
}

function rgba({ r, g, b }: AxisAccentRgb, alpha: number): string {
  return `rgba(${r},${g},${b},${alpha})`;
}

export function formatLobbyStatusBarClass(token: AxisAccentToken): string {
  return `${token.lobbyBgClass} shadow-[0_0_14px_${token.lobbyGlowRgba}]`;
}

function buildRadarPalette(token: AxisAccentToken, rgb: AxisAccentRgb): AxisRadarPalette {
  return {
    auraStops: [rgba(rgb, 0.1), rgba(rgb, 0.22), rgba(rgb, 0.4)] as const,
    stroke: token.stroke,
    glow: rgba(rgb, 0.6),
    reactorCore: token.reactorCore,
    reactorRing: rgba(rgb, 0.58),
  };
}

/** Warm–cool crossflow grid: amber → indigo → teal (left), emerald → rose → purple (right). */
export const SIX_AXIS_ACCENT_TOKENS: Record<SixAxisMetric, AxisAccentToken> = {
  strength: {
    lobbyBgClass: 'bg-amber-500',
    lobbyGlowRgba: 'rgba(245,158,11,0.6)',
    stroke: '#f59e0b',
    reactorCore: '#fbbf24',
  },
  gripStrength: {
    lobbyBgClass: 'bg-emerald-400',
    lobbyGlowRgba: 'rgba(52,211,153,0.6)',
    stroke: '#34d399',
    reactorCore: '#6ee7b7',
  },
  bodyFat: {
    lobbyBgClass: 'bg-indigo-500',
    lobbyGlowRgba: 'rgba(99,102,241,0.6)',
    stroke: '#6366f1',
    reactorCore: '#818cf8',
  },
  explosivePower: {
    lobbyBgClass: 'bg-rose-500',
    lobbyGlowRgba: 'rgba(244,63,94,0.6)',
    stroke: '#f43f5e',
    reactorCore: '#fb7185',
  },
  cardio: {
    lobbyBgClass: 'bg-teal-400',
    lobbyGlowRgba: 'rgba(45,212,191,0.6)',
    stroke: '#2dd4bf',
    reactorCore: '#5eead4',
  },
  muscleMass: {
    lobbyBgClass: 'bg-purple-500',
    lobbyGlowRgba: 'rgba(168,85,247,0.6)',
    stroke: '#a855f7',
    reactorCore: '#c084fc',
  },
};

const SIX_AXIS_ACCENT_RGB: Record<SixAxisMetric, AxisAccentRgb> = {
  strength: { r: 245, g: 158, b: 11 },
  gripStrength: { r: 52, g: 211, b: 153 },
  bodyFat: { r: 99, g: 102, b: 241 },
  explosivePower: { r: 244, g: 63, b: 94 },
  cardio: { r: 45, g: 212, b: 191 },
  muscleMass: { r: 168, g: 85, b: 247 },
};

/** Non–six-axis lobby footer — tactical slate so armSize never collides with muscleMass purple. */
export const ARM_SIZE_LOBBY_STATUS_BAR_CLASS =
  'bg-slate-400 shadow-[0_0_14px_rgba(148,163,184,0.6)]';

export function getSixAxisLobbyStatusBarClass(metric: SixAxisMetric): string {
  return formatLobbyStatusBarClass(SIX_AXIS_ACCENT_TOKENS[metric]);
}

export function getSixAxisRadarPalette(metric: SixAxisMetric): AxisRadarPalette {
  return buildRadarPalette(SIX_AXIS_ACCENT_TOKENS[metric], SIX_AXIS_ACCENT_RGB[metric]);
}

export const SIX_AXIS_RADAR_PALETTES: Record<SixAxisMetric, AxisRadarPalette> = Object.fromEntries(
  SIX_AXIS_METRICS.map((metric) => [metric, getSixAxisRadarPalette(metric)])
) as Record<SixAxisMetric, AxisRadarPalette>;
