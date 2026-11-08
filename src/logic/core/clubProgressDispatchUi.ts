/**
 * Club Progress Dispatch — client UI helpers (comment clamp, metric map, panel gate).
 * WHY: Keep Breakthrough / Crew presentational; pure functions stay unit-testable.
 */
import type { ClubLadderDimension } from './guildRadarScores';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../../types/scoring';
import type { BreakthroughMetric } from './performanceBreakthrough';

export const CLUB_DISPATCH_COMMENT_MAX_LEN = 25;

export const CLUB_DISPATCH_TAG_KEYS = [
  'overlimit',
  'challenge',
  'nearDeath',
] as const;

export type ClubDispatchTagKey = (typeof CLUB_DISPATCH_TAG_KEYS)[number];

/** localStorage flag — first-run hint under Breakthrough broadcast toggle. */
export const CLUB_DISPATCH_BROADCAST_HINT_SEEN_KEY = 'up.clubDispatch.broadcastHintSeen';

/** localStorage mirror of mute — UI hydration until a prefs-read Callable exists. */
export const CLUB_DISPATCH_MUTE_LOCAL_KEY = 'up.clubDispatch.muteClubDispatches';

/**
 * Live input clamp — strip illegal chars + maxLen only.
 * WHY: Must NOT trim/collapse on every keystroke or spaces between words become untypeable.
 */
export function clampDispatchComment(raw: unknown, maxLen = CLUB_DISPATCH_COMMENT_MAX_LEN): string {
  if (typeof raw !== 'string') return '';
  const cleaned = raw.replace(/[<>\u0000-\u001F\u007F]/g, '');
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen);
}

/**
 * Submit-time sanitize — aligns with server `sanitizeDispatchComment` (trim + collapse).
 */
export function finalizeDispatchComment(
  raw: unknown,
  maxLen = CLUB_DISPATCH_COMMENT_MAX_LEN
): string {
  if (typeof raw !== 'string') return '';
  const collapsed = raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[<>\u0000-\u001F\u007F]/g, '');
  if (collapsed.length <= maxLen) return collapsed;
  return collapsed.slice(0, maxLen);
}

/**
 * Map breakthrough page metric → guild broadcast dimension.
 * Specialty axes (armSize / cooper) fall back to overall (ladderScore).
 */
export function resolveBroadcastMetricFromBreakthrough(
  metric: BreakthroughMetric
): ClubLadderDimension {
  if ((SIX_AXIS_METRICS as readonly string[]).includes(metric)) {
    return metric as SixAxisMetric;
  }
  return 'overall';
}

/**
 * Show dispatch panel only for dual membership (club CTA surface).
 * Positive-delta gate remains server-side (D2).
 */
export function shouldShowBreakthroughDispatchPanel(
  membershipSurface: 'pending' | 'dual' | 'global-only'
): boolean {
  return membershipSurface === 'dual';
}

export function readBroadcastHintSeen(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  try {
    return storage.getItem(CLUB_DISPATCH_BROADCAST_HINT_SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function markBroadcastHintSeen(storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(CLUB_DISPATCH_BROADCAST_HINT_SEEN_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}

/** Default receive ON → mute false when unset. */
export function readLocalMuteClubDispatches(
  storage: Pick<Storage, 'getItem'> = localStorage
): boolean {
  try {
    return storage.getItem(CLUB_DISPATCH_MUTE_LOCAL_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeLocalMuteClubDispatches(
  mute: boolean,
  storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage
): void {
  try {
    if (mute) storage.setItem(CLUB_DISPATCH_MUTE_LOCAL_KEY, '1');
    else storage.removeItem(CLUB_DISPATCH_MUTE_LOCAL_KEY);
  } catch {
    // ignore quota / private mode
  }
}
