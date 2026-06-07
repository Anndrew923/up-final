import { SIX_AXIS_METRICS, type SixAxisMetric } from '../types/scoring';

/**
 * Single source of truth for Core Six axis accent colors (WHY): Lobby status bars and radar
 * dominant palettes must share identical hue identity so dyno cards and Home radar read as one
 * instrument cluster — seven rigid hue slots, max perceptual separation on dark UI.
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

/**
 * Rigid seven-hue grid (2×3 + slate footer):
 * L: amber → sky → teal | R: lime → red → fuchsia | base: slate (armSize).
 */
export const SIX_AXIS_ACCENT_TOKENS: Record<SixAxisMetric, AxisAccentToken> = {
  strength: {
    lobbyBgClass: 'bg-amber-500',
    lobbyGlowRgba: 'rgba(245,158,11,0.6)',
    stroke: '#f59e0b',
    reactorCore: '#fbbf24',
  },
  gripStrength: {
    lobbyBgClass: 'bg-lime-400',
    lobbyGlowRgba: 'rgba(163,230,53,0.6)',
    stroke: '#a3e635',
    reactorCore: '#bef264',
  },
  bodyFat: {
    lobbyBgClass: 'bg-sky-400',
    lobbyGlowRgba: 'rgba(56,189,248,0.6)',
    stroke: '#38bdf8',
    reactorCore: '#7dd3fc',
  },
  explosivePower: {
    lobbyBgClass: 'bg-red-500',
    lobbyGlowRgba: 'rgba(239,68,68,0.6)',
    stroke: '#ef4444',
    reactorCore: '#f87171',
  },
  cardio: {
    lobbyBgClass: 'bg-teal-400',
    lobbyGlowRgba: 'rgba(45,212,191,0.6)',
    stroke: '#2dd4bf',
    reactorCore: '#5eead4',
  },
  muscleMass: {
    lobbyBgClass: 'bg-fuchsia-500',
    lobbyGlowRgba: 'rgba(217,70,239,0.6)',
    stroke: '#d946ef',
    reactorCore: '#e879f9',
  },
};

const SIX_AXIS_ACCENT_RGB: Record<SixAxisMetric, AxisAccentRgb> = {
  strength: { r: 245, g: 158, b: 11 },
  gripStrength: { r: 163, g: 230, b: 53 },
  bodyFat: { r: 56, g: 189, b: 248 },
  explosivePower: { r: 239, g: 68, b: 68 },
  cardio: { r: 45, g: 212, b: 191 },
  muscleMass: { r: 217, g: 70, b: 239 },
};

/** Non–six-axis lobby footer — tactical slate so armSize never collides with Core Six hues. */
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
