/**
 * Crew / private guild contracts (Firestore `guilds/{guildId}`).
 * WHY: UI says "Club"; storage IDs stay `guild*` for stable Callable/rules paths.
 */

import type { SixAxisMetric } from './scoring';

export type GuildRole = 'coach' | 'member';

/**
 * Embedded six-axis snapshot for club private ladder radar + axis funnel (no preview doc).
 * WHY: Partial — absent keys mean “not assessed” (sort last / show —), not coerced 0.
 */
export type GuildRadarScores = Partial<Record<SixAxisMetric, number>>;

/** Denormalized row inside `guilds.members` — O(1) private ladder read. */
export interface GuildMemberSnapshot {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  /** Composite ladder score (`ladderScore` shard). */
  ladderScore: number;
  /** Optional six-axis map for HexRadar + dimension sort (Club C1/C2). */
  radarScores?: GuildRadarScores;
  updatedAt: string;
}

export interface GuildDoc {
  id: string;
  name: string;
  /** Short display tag (2–4 chars from invite alphabet). */
  tag: string;
  coachUid: string;
  inviteCode: string;
  memberCount: number;
  maxMembers: number;
  /** Parallel uid list for Security Rules `in` checks. */
  memberUids: string[];
  members: GuildMemberSnapshot[];
  createdAt: string;
  updatedAt: string;
  /** Soft-delete marker when disbanded (optional). */
  status?: 'active' | 'disbanded';
}

/** Fields mirrored onto `users/{uid}` by Admin SDK only. */
export interface UserGuildFields {
  guildId?: string | null;
  guildRole?: GuildRole | null;
  guildJoinedAt?: string | null;
}

/** Keep in lockstep with `functions/shared/constants.js` → `GUILD_*`. */
export const GUILD_MAX_MEMBERS = 30;

export const GUILD_NAME_MIN_LEN = 2;
export const GUILD_NAME_MAX_LEN = 24;
export const GUILD_TAG_MIN_LEN = 2;
export const GUILD_TAG_MAX_LEN = 4;
