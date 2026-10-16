/**
 * Club roster radarScores helpers — sanitize + client-side dimension sort.
 * WHY: Private ladder stays O(1) getDoc; axis funnel never hits Firestore.
 */
import type { GuildMemberSnapshot, GuildRadarScores } from '../../types/guild';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../../types/scoring';
import { clampScoreMapValue } from './scoring';

export type ClubLadderDimension = 'overall' | SixAxisMetric;

export const CLUB_LADDER_DIMENSIONS: readonly ClubLadderDimension[] = [
  'overall',
  ...SIX_AXIS_METRICS,
] as const;

/**
 * Clamp present axes only — never invent 0 for missing keys.
 * WHY: Missing axis must sort last and render "—" in the dimension funnel.
 */
export function sanitizeGuildRadarScores(raw: unknown): GuildRadarScores | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const src = raw as Record<string, unknown>;
  const out: GuildRadarScores = {};
  let any = false;
  for (const key of SIX_AXIS_METRICS) {
    if (!Object.prototype.hasOwnProperty.call(src, key)) continue;
    const n = Number(src[key]);
    if (!Number.isFinite(n)) continue;
    out[key] = clampScoreMapValue(n);
    any = true;
  }
  return any ? out : undefined;
}

export function guildMemberHasRadarScores(member: GuildMemberSnapshot): boolean {
  const radar = member.radarScores;
  if (!radar) return false;
  return SIX_AXIS_METRICS.some((k) => {
    const v = radar[k];
    return typeof v === 'number' && Number.isFinite(v) && v > 0;
  });
}

/** Null when axis missing — callers sort nulls to the end. */
export function guildMemberDimensionScore(
  member: GuildMemberSnapshot,
  dimension: ClubLadderDimension
): number | null {
  if (dimension === 'overall') {
    return Number.isFinite(member.ladderScore) ? member.ladderScore : null;
  }
  if (!member.radarScores || !Object.prototype.hasOwnProperty.call(member.radarScores, dimension)) {
    return null;
  }
  const raw = member.radarScores[dimension];
  if (raw == null || !Number.isFinite(raw)) return null;
  return clampScoreMapValue(raw);
}

/**
 * Desc by selected dimension; missing axis values sort last; stable name/uid tie-break.
 */
export function sortGuildMembersByDimension(
  members: readonly GuildMemberSnapshot[],
  dimension: ClubLadderDimension
): GuildMemberSnapshot[] {
  return [...members].sort((a, b) => {
    const sa = guildMemberDimensionScore(a, dimension);
    const sb = guildMemberDimensionScore(b, dimension);
    const aMissing = sa == null;
    const bMissing = sb == null;
    if (aMissing !== bMissing) return aMissing ? 1 : -1;
    if (!aMissing && !bMissing && sb !== sa) return sb! - sa!;
    const byName = a.displayName.localeCompare(b.displayName);
    if (byName !== 0) return byName;
    return a.uid.localeCompare(b.uid);
  });
}
