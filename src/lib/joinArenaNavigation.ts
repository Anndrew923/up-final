import { ROUTES, type RoutePath } from '../config/routes';
import type { GateFeature } from '../logic/core/entitlement';
import type { JoinArenaFrom } from '../types/uiGate';

export type { JoinArenaFrom } from '../types/uiGate';

/** Allowlist of in-app paths safe for Join Arena `returnTo` (blocks open redirects). */
const ALLOWED_RETURN_TO_PATHS: ReadonlySet<string> = new Set(Object.values(ROUTES));

export function isAllowedJoinArenaReturnTo(path: string): path is RoutePath {
  return ALLOWED_RETURN_TO_PATHS.has(path);
}

export function parseJoinArenaFrom(search: string): JoinArenaFrom | null {
  const raw = new URLSearchParams(search).get('from');
  if (raw === 'ladder' || raw === 'backup' || raw === 'settings' || raw === 'dyno-intel') {
    return raw;
  }
  return null;
}

/**
 * Parses `returnTo` only when it matches a known `ROUTES.*` path.
 * WHY: Paywall success must resume the user's surface without accepting arbitrary URLs.
 */
export function parseJoinArenaReturnTo(search: string): RoutePath | null {
  const raw = new URLSearchParams(search).get('returnTo');
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  return isAllowedJoinArenaReturnTo(decoded) ? decoded : null;
}

export type JoinArenaDescriptionKey =
  | 'joinDescription'
  | 'joinDescriptionFromLadder'
  | 'joinDescriptionFromBackup'
  | 'joinDescriptionFromDynoIntel';

export function joinArenaDescriptionKey(from: JoinArenaFrom | null): JoinArenaDescriptionKey {
  if (from === 'ladder') return 'joinDescriptionFromLadder';
  if (from === 'backup') return 'joinDescriptionFromBackup';
  if (from === 'dyno-intel') return 'joinDescriptionFromDynoIntel';
  return 'joinDescription';
}

/**
 * Builds Join Arena URL with contextual `from` + optional allowlisted `returnTo`.
 * WHY: Components must not hardcode query strings — one generator keeps funnel analytics + redirects consistent.
 */
export function joinArenaPath(from?: JoinArenaFrom, returnTo?: string): string {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (returnTo && isAllowedJoinArenaReturnTo(returnTo)) {
    params.set('returnTo', returnTo);
  }
  const qs = params.toString();
  return qs ? `${ROUTES.joinArena}?${qs}` : ROUTES.joinArena;
}

/**
 * Resolves post-purchase / post-auth destination.
 * Priority: explicit allowlisted `returnTo` → funnel default → home.
 */
export function resolveJoinArenaReturnTo(
  from: JoinArenaFrom | null,
  search: string
): RoutePath {
  const explicit = parseJoinArenaReturnTo(search);
  if (explicit) return explicit;
  // WHY: Backup funnel lives on Tools; Dyno should never dump users onto the ladder.
  if (from === 'backup') return ROUTES.tools;
  if (from === 'dyno-intel') return ROUTES.home;
  return ROUTES.ladder;
}

/** Maps Join Arena entry context to the unified UI gate feature key. */
export function joinArenaGateFeature(from: JoinArenaFrom | null): GateFeature {
  if (from === 'backup') return 'cloud-sync';
  if (from === 'dyno-intel') return 'dyno-intel-full';
  return 'ladder-read';
}
