/**
 * Bottom navigation — single source of truth for tab order, paths, and icons.
 *
 * Mirrors reference-app-fitness `BottomNavBar.jsx` ordering. Labels are i18n keys (`navbar.*`).
 * `guestRestricted` reserves fitness-style gating for tabs that should prompt guests (behavior TBD).
 */

export type NavItemKey = 'home' | 'assessment' | 'ladder' | 'history' | 'tools';

/**
 * Icon identifiers for Phase 1 mapping (reuse fitness SVG shapes as React components).
 * Matches the implicit icon order in BottomNavBar.jsx — do not reorder without updating NAV_ITEMS order.
 */
export type NavIconId = 'people' | 'home' | 'layers-plus' | 'grid-rank' | 'clock' | 'wrench-box';

export interface NavItemConfig {
  /** Stable key — use for analytics and i18n sub-keys */
  key: NavItemKey;
  /** Route path when react-router is added */
  path: string;
  /**
   * When true: matches fitness `guestBlock` — gate or prompt guest users (Phase 1 behavior TBD).
   */
  guestRestricted: boolean;
  /** i18n lookup: `t(labelKey, { ns: 'common' })` */
  labelKey:
    | 'navbar.home'
    | 'navbar.assessment'
    | 'navbar.ladder'
    | 'navbar.history'
    | 'navbar.tools';
  iconId: NavIconId;
  /** Optional notes for Phase 1 — not shown in UI */
  specNotes?: string;
}

export const NAV_ITEMS: readonly NavItemConfig[] = [
  {
    key: 'home',
    path: '/user-info',
    guestRestricted: false,
    labelKey: 'navbar.home',
    iconId: 'home',
    specNotes:
      'Fitness smart home: logged-in or guest → /user-info; else /landing — Phase 1 router',
  },
  {
    key: 'tools',
    path: '/training-tools',
    guestRestricted: false,
    labelKey: 'navbar.tools',
    iconId: 'wrench-box',
    specNotes: 'Utility deck and Pro cloud sync entry',
  },
  {
    key: 'assessment',
    path: '/skill-tree',
    guestRestricted: false,
    labelKey: 'navbar.assessment',
    iconId: 'layers-plus',
    specNotes: 'Fitness labels this tab assessment but routes to skill-tree',
  },
  {
    key: 'ladder',
    path: '/ladder',
    guestRestricted: true,
    labelKey: 'navbar.ladder',
    iconId: 'grid-rank',
    specNotes: 'Leaderboard — requires Pro for cloud; gate in route/service',
  },
  {
    key: 'history',
    path: '/history',
    guestRestricted: false,
    labelKey: 'navbar.history',
    iconId: 'clock',
    specNotes: 'Local-first history stays Core — no guest modal for browsing own records.',
  },
] as const;

/** Strip leading slash for nested `<Route path>` under `/` (React Router). */
export function toRelativeRoutePath(navPath: string): string {
  const trimmed = navPath.endsWith('/') && navPath.length > 1 ? navPath.slice(0, -1) : navPath;
  return trimmed.replace(/^\//, '');
}
