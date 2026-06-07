import type { SixAxisMetric } from '../types/scoring';
import { ROUTES } from './routes';
import type { RoutePath } from './routes';
import {
  ARM_SIZE_LOBBY_STATUS_BAR_CLASS,
  getSixAxisLobbyStatusBarClass,
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
 * Raw-input grid order on Assessment (WHY): Matches the 2×3 lobby card positions for the six
 * radar axes so operators read the same left-to-right / top-to-bottom map as the dyno cards.
 * Excludes `armSize` (leaderboard-only, full-width lobby card). Do not reuse `SIX_AXIS_METRICS`
 * here—that order drives radar vertices and history columns globally.
 */
export const ASSESSMENT_RAW_INPUT_GRID_ORDER = [
  'strength',
  'gripStrength',
  'bodyFat',
  'explosivePower',
  'cardio',
  'muscleMass',
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
 * Per-dimension StatusBar glow (WHY): Warm–cool crossflow grid sourced from
 * `sharedAxisAccentTokens` — lobby hues match radar dominant palettes stroke-for-stroke.
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
