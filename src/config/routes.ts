/**
 * Application routes — derived from `NAV_ITEMS` paths plus non-tab routes.
 */
import type { NavItemKey } from './nav.config';
import { NAV_ITEMS } from './nav.config';

const NAV_ROUTE_MAP = Object.fromEntries(NAV_ITEMS.map((item) => [item.key, item.path])) as Record<
  NavItemKey,
  string
>;

export const ROUTES = {
  root: '/' as const,
  authChoice: '/auth-choice' as const,
  settings: '/settings' as const,
  about: '/about' as const,
  contact: '/contact' as const,
  privacyPolicy: '/privacy-policy' as const,
  joinArena: '/join-arena' as const,
  leaderboardDebug: '/debug/leaderboard' as const,
  ffmi: '/ffmi' as const,
  cardio: '/cardio' as const,
  muscle: '/muscle' as const,
  explosive: '/explosive' as const,
  strength: '/strength' as const,
  grip: '/grip' as const,
  armSize: '/arm-size' as const,
  ...NAV_ROUTE_MAP,
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
