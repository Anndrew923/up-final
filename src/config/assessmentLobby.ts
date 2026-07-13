import type { SixAxisMetric } from '../types/scoring';
import { ROUTES } from './routes';
import type { RoutePath } from './routes';
import {
  ARM_SIZE_ACCENT_RGB,
  ARM_SIZE_LOBBY_STATUS_BAR_CLASS,
  getSixAxisAccentRgb,
  getSixAxisLobbyStatusBarClass,
  type AxisAccentRgb,
} from './sharedAxisAccentTokens';

export const ASSESSMENT_LOBBY_CARD_KEYS = [
  'strength',
  'grip',
  'ffmi',
  'explosive',
  'cardio',
  'muscle',
  'armSize',
] as const;

export type AssessmentLobbyCardKey = (typeof ASSESSMENT_LOBBY_CARD_KEYS)[number];

/** Lobby card that spans both columns at the bottom of the grid. */
export const ASSESSMENT_LOBBY_FULL_WIDTH_CARD_KEY =
  'armSize' as const satisfies AssessmentLobbyCardKey;

/**
 * Six-axis order as a row-major 2-column map matching lobby card positions
 * (L→R, T→B). Excludes `armSize` (leaderboard-only). Do not reuse `SIX_AXIS_METRICS`
 * here — that order drives radar vertices and history columns globally.
 */
export const SIX_AXIS_LOBBY_GRID_ORDER = [
  'strength',
  'gripStrength',
  'bodyFat',
  'explosivePower',
  'cardio',
  'muscleMass',
] as const satisfies readonly SixAxisMetric[];

/**
 * Six-axis snapshot columns derived from the lobby map (even → left, odd → right).
 * WHY: Single source of truth so the read-only Dyno snapshot panel stays locked to the card grid.
 */
export const SIX_AXIS_SNAPSHOT_LEFT_AXES = [
  SIX_AXIS_LOBBY_GRID_ORDER[0],
  SIX_AXIS_LOBBY_GRID_ORDER[2],
  SIX_AXIS_LOBBY_GRID_ORDER[4],
] as const satisfies readonly SixAxisMetric[];

export const SIX_AXIS_SNAPSHOT_RIGHT_AXES = [
  SIX_AXIS_LOBBY_GRID_ORDER[1],
  SIX_AXIS_LOBBY_GRID_ORDER[3],
  SIX_AXIS_LOBBY_GRID_ORDER[5],
] as const satisfies readonly SixAxisMetric[];

export const ASSESSMENT_LOBBY_ROUTES: Record<AssessmentLobbyCardKey, RoutePath> = {
  strength: ROUTES.strength,
  grip: ROUTES.grip,
  armSize: ROUTES.armSize,
  explosive: ROUTES.explosive,
  cardio: ROUTES.cardio,
  muscle: ROUTES.muscle,
  ffmi: ROUTES.ffmi,
};

/** Lobby card key → Core Six metric (armSize excluded — leaderboard-only footer). */
export const ASSESSMENT_LOBBY_SIX_AXIS_MAP = {
  strength: 'strength',
  grip: 'gripStrength',
  ffmi: 'bodyFat',
  explosive: 'explosivePower',
  cardio: 'cardio',
  muscle: 'muscleMass',
} as const satisfies Record<Exclude<AssessmentLobbyCardKey, 'armSize'>, SixAxisMetric>;

/**
 * Per-dimension StatusBar glow (WHY): Rigid seven-hue grid from `sharedAxisAccentTokens` —
 * lobby status bars and radar dominant stroke stay parity-locked.
 */
export const ASSESSMENT_LOBBY_STATUS_BAR_CLASS: Record<AssessmentLobbyCardKey, string> = {
  strength: getSixAxisLobbyStatusBarClass(ASSESSMENT_LOBBY_SIX_AXIS_MAP.strength),
  grip: getSixAxisLobbyStatusBarClass(ASSESSMENT_LOBBY_SIX_AXIS_MAP.grip),
  ffmi: getSixAxisLobbyStatusBarClass(ASSESSMENT_LOBBY_SIX_AXIS_MAP.ffmi),
  explosive: getSixAxisLobbyStatusBarClass(ASSESSMENT_LOBBY_SIX_AXIS_MAP.explosive),
  cardio: getSixAxisLobbyStatusBarClass(ASSESSMENT_LOBBY_SIX_AXIS_MAP.cardio),
  muscle: getSixAxisLobbyStatusBarClass(ASSESSMENT_LOBBY_SIX_AXIS_MAP.muscle),
  armSize: ARM_SIZE_LOBBY_STATUS_BAR_CLASS,
};

export function resolveAssessmentLobbyAccentRgb(
  cardKey: AssessmentLobbyCardKey
): AxisAccentRgb {
  if (cardKey === 'armSize') {
    return ARM_SIZE_ACCENT_RGB;
  }
  return getSixAxisAccentRgb(ASSESSMENT_LOBBY_SIX_AXIS_MAP[cardKey]);
}
