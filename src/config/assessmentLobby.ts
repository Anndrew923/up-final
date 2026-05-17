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
