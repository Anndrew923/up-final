/**
 * Pure guild document parse + private-ladder sort helpers.
 * WHY: Keep Firestore shape validation out of hooks/UI; unit-testable without SDK.
 */
import type { GuildDoc, GuildMemberSnapshot, GuildRole } from '../../types/guild';
import {
  GUILD_MAX_MEMBERS,
  GUILD_NAME_MAX_LEN,
  GUILD_NAME_MIN_LEN,
  GUILD_TAG_MAX_LEN,
  GUILD_TAG_MIN_LEN,
} from '../../types/guild';
import { GUILD_INVITE_CODE_ALPHABET } from './guildInviteCode';
import { sanitizeGuildRadarScores } from './guildRadarScores';

export interface UserGuildBinding {
  guildId: string;
  guildRole: GuildRole;
}

/**
 * @param data Raw `users/{uid}` fields
 */
export function parseUserGuildBinding(data: unknown): UserGuildBinding | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;
  const guildId =
    typeof raw.guildId === 'string'
      ? raw.guildId.trim()
      : typeof raw.guild_id === 'string'
        ? raw.guild_id.trim()
        : '';
  if (!guildId) return null;
  const roleRaw = raw.guildRole ?? raw.guild_role;
  const guildRole: GuildRole = roleRaw === 'coach' ? 'coach' : 'member';
  return { guildId, guildRole };
}

function parseMemberSnapshot(raw: unknown): GuildMemberSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  if (typeof m.uid !== 'string' || !m.uid.trim()) return null;
  const score = Number(m.ladderScore);
  const displayName =
    typeof m.displayName === 'string' && m.displayName.trim()
      ? m.displayName.trim()
      : m.uid.slice(0, 8);
  const updatedAt =
    typeof m.updatedAt === 'string' && m.updatedAt.trim()
      ? m.updatedAt
      : new Date(0).toISOString();
  const snapshot: GuildMemberSnapshot = {
    uid: m.uid.trim(),
    displayName,
    ladderScore: Number.isFinite(score) ? Math.max(0, score) : 0,
    updatedAt,
  };
  if (typeof m.avatarUrl === 'string' && m.avatarUrl.startsWith('https://')) {
    snapshot.avatarUrl = m.avatarUrl;
  }
  const radarScores = sanitizeGuildRadarScores(m.radarScores);
  if (radarScores) {
    snapshot.radarScores = radarScores;
  }
  return snapshot;
}

/**
 * @param id Document id
 * @param data Firestore payload
 */
export function parseGuildDoc(id: string, data: unknown): GuildDoc | null {
  if (!id || !data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.status === 'disbanded') return null;

  const name = typeof d.name === 'string' ? d.name.trim() : '';
  const tag = typeof d.tag === 'string' ? d.tag.trim().toUpperCase() : '';
  const coachUid = typeof d.coachUid === 'string' ? d.coachUid.trim() : '';
  const inviteCode = typeof d.inviteCode === 'string' ? d.inviteCode.trim().toUpperCase() : '';
  if (!name || !tag || !coachUid || !inviteCode) return null;

  const memberUids = Array.isArray(d.memberUids)
    ? d.memberUids.filter((x): x is string => typeof x === 'string' && Boolean(x.trim()))
    : [];
  const members = Array.isArray(d.members)
    ? d.members.map(parseMemberSnapshot).filter((m): m is GuildMemberSnapshot => m != null)
    : [];
  const rawCount = Number(d.memberCount);
  const memberCount = Number.isFinite(rawCount)
    ? Math.max(0, Math.floor(rawCount))
    : memberUids.length;
  const rawMax = Number(d.maxMembers);
  const maxMembers =
    Number.isFinite(rawMax) && rawMax > 0 ? Math.floor(rawMax) : GUILD_MAX_MEMBERS;
  const createdAt =
    typeof d.createdAt === 'string' && d.createdAt ? d.createdAt : new Date(0).toISOString();
  const updatedAt =
    typeof d.updatedAt === 'string' && d.updatedAt ? d.updatedAt : createdAt;

  return {
    id,
    name,
    tag,
    coachUid,
    inviteCode,
    memberCount,
    maxMembers,
    memberUids,
    members,
    createdAt,
    updatedAt,
    status: 'active',
  };
}

/** Desc ladderScore; tie-break displayName then uid for stable ranks. */
export function sortGuildMembersByScore(
  members: readonly GuildMemberSnapshot[]
): GuildMemberSnapshot[] {
  return [...members].sort((a, b) => {
    if (b.ladderScore !== a.ladderScore) return b.ladderScore - a.ladderScore;
    const byName = a.displayName.localeCompare(b.displayName);
    if (byName !== 0) return byName;
    return a.uid.localeCompare(b.uid);
  });
}

/**
 * Client-side name normalize — mirror `functions/guild/guildCore.js`.
 */
export function normalizeGuildNameClient(raw: unknown): { ok: true; name: string } | { ok: false } {
  if (typeof raw !== 'string') return { ok: false };
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < GUILD_NAME_MIN_LEN || name.length > GUILD_NAME_MAX_LEN) return { ok: false };
  if (/[<>\u0000-\u001F\u007F]/.test(name)) return { ok: false };
  return { ok: true, name };
}

/**
 * Client-side tag normalize — same alphabet as invite codes, length 2–4.
 */
export function normalizeGuildTagClient(raw: unknown): { ok: true; tag: string } | { ok: false } {
  if (typeof raw !== 'string') return { ok: false };
  const tag = raw.trim().toUpperCase().replace(/[\s\-_.]/g, '');
  if (tag.length < GUILD_TAG_MIN_LEN || tag.length > GUILD_TAG_MAX_LEN) return { ok: false };
  for (const ch of tag) {
    if (!GUILD_INVITE_CODE_ALPHABET.includes(ch)) return { ok: false };
  }
  return { ok: true, tag };
}
