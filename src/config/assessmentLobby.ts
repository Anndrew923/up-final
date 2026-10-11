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

/**
 * Dyno lobby visual SSOT — three-layer Bento with asymmetric weights.
 * WHY: Decoupled from `SIX_AXIS_LOBBY_GRID_ORDER` so snapshot + radar axis order stay stable.
 */
export const LOBBY_BENTO_LAYOUT = [
  { key: 'strength', size: 'hero', colSpan: 2, layer: 'power' },
  { key: 'grip', size: 'standard', colSpan: 1, layer: 'power' },
  { key: 'explosive', size: 'standard', colSpan: 1, layer: 'power' },
  // Chassis layer: CHSS ∥ P2W, then full-width STINT capsule.
  { key: 'muscle', size: 'capsule', colSpan: 1, layer: 'chassis' },
  { key: 'ffmi', size: 'standard', colSpan: 1, layer: 'chassis' },
  { key: 'cardio', size: 'capsule', colSpan: 2, layer: 'chassis' },
  { key: 'armSize', size: 'capsule', colSpan: 1, layer: 'specialty' },
] as const;

export type LobbyBentoSlot = (typeof LOBBY_BENTO_LAYOUT)[number];
export type AssessmentLobbyCardKey = LobbyBentoSlot['key'];
export type AssessmentLobbyCardSize = LobbyBentoSlot['size'];
/** Semantic layers for Dyno lobby IA (power → chassis → specialty). */
export type AssessmentLobbyLayer = LobbyBentoSlot['layer'];

/** All lobby keys — derived from Bento layout so visual order and key set cannot drift. */
export const ASSESSMENT_LOBBY_CARD_KEYS: readonly AssessmentLobbyCardKey[] = LOBBY_BENTO_LAYOUT.map(
  (slot) => slot.key
);

/**
 * Six-axis order for the read-only snapshot panel (L→R, T→B in a 2-col map).
 * WHY: Must NOT track Bento visual order — radar vertices / history columns stay global.
 * Excludes `armSize` (leaderboard specialty). Do not reuse `SIX_AXIS_METRICS` here.
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
 * WHY: Single source of truth so the read-only Dyno snapshot panel stays locked to this map.
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

/** Lobby card key → Core Six metric (armSize excluded — leaderboard specialty). */
export const ASSESSMENT_LOBBY_SIX_AXIS_MAP = {
  strength: 'strength',
  grip: 'gripStrength',
  ffmi: 'bodyFat',
  explosive: 'explosivePower',
  cardio: 'cardio',
  muscle: 'muscleMass',
} as const satisfies Record<Exclude<AssessmentLobbyCardKey, 'armSize'>, SixAxisMetric>;

/**
 * Per-axis Tailwind accent class map (WHY): Lobby cards render glow via RGB CSS vars now,
 * but this map stays as the seven-hue parity lock with radar / diagnostic scan tokens
 * (unique bg + glow rgba contract enforced in sharedAxisAccentTokens tests).
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
