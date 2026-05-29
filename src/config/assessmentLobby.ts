import { ROUTES } from './routes';
import type { RoutePath } from './routes';

export const ASSESSMENT_LOBBY_CARD_KEYS = [
  'strength',
  'grip',
  'armSize',
  'explosive',
  'cardio',
  'muscle',
  'ffmi',
] as const;

export type AssessmentLobbyCardKey = (typeof ASSESSMENT_LOBBY_CARD_KEYS)[number];

export const ASSESSMENT_LOBBY_ROUTES: Record<AssessmentLobbyCardKey, RoutePath> = {
  strength: ROUTES.strength,
  grip: ROUTES.grip,
  armSize: ROUTES.armSize,
  explosive: ROUTES.explosive,
  cardio: ROUTES.cardio,
  muscle: ROUTES.muscle,
  ffmi: ROUTES.ffmi,
};

/**
 * Per-dimension StatusBar glow on lobby cards (WHY): One accent per assessment axis so the
 * lobby reads as a dense instrument panel—not a generic list. Colors are fixed here so UI
 * stays token-consistent and future cards only extend this map + `ASSESSMENT_LOBBY_CARD_KEYS`.
 */
export const ASSESSMENT_LOBBY_STATUS_BAR_CLASS: Record<AssessmentLobbyCardKey, string> = {
  strength: 'bg-accent-primary shadow-[0_0_14px_rgba(255,140,0,0.7)]',
  grip: 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.6)]',
  armSize: 'bg-fuchsia-400 shadow-[0_0_14px_rgba(232,121,249,0.6)]',
  explosive: 'bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.65)]',
  cardio: 'bg-accent-info shadow-[0_0_14px_rgba(0,191,255,0.65)]',
  muscle: 'bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.6)]',
  ffmi: 'bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,0.6)]',
};
