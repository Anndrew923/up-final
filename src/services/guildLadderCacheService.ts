/**
 * Guild doc getDoc + 5-minute TTL cache (no onSnapshot).
 * WHY: Private ladder is O(1) read; TTL cuts repeat Garage/Crew visits.
 */
import { doc, getDoc } from 'firebase/firestore';
import {
  parseGuildDoc,
  parseUserGuildBinding,
  type UserGuildBinding,
} from '../logic/core/guildDoc';
import type { GuildDoc } from '../types/guild';
import { getFirestoreDb } from './firebaseClient';
import {
  GUILDS_COLLECTION,
  USER_CLOUD_COLLECTION,
} from './firestorePaths';

export const GUILD_LADDER_TTL_MS = 5 * 60 * 1000;

export interface GuildCacheEntry {
  guild: GuildDoc;
  cachedAt: string;
}

export type GuildCacheFreshness = 'fresh' | 'stale';

export interface GuildCacheLookup {
  data: GuildCacheEntry;
  freshness: GuildCacheFreshness;
}

export type FetchGuildDocResult =
  | { ok: true; guild: GuildDoc; fromCache: boolean }
  | { ok: false; reason: 'no-db' | 'not-found' | 'read-error' | 'disbanded' };

const memory = new Map<string, GuildCacheEntry>();
const DISK_PREFIX = 'up:guild-cache:v1:';

/** Session binding cache — Garage + Crew remounts must not re-getDoc users/{uid} every time. */
const BINDING_TTL_MS = GUILD_LADDER_TTL_MS;
const BINDING_DISK_PREFIX = 'up:guild-binding:v1:';

type BindingCacheEntry = {
  uid: string;
  binding: UserGuildBinding | null;
  cachedAtMs: number;
};

let bindingMemory: BindingCacheEntry | null = null;

function bindingDiskKey(uid: string): string {
  return `${BINDING_DISK_PREFIX}${uid}`;
}

function readBindingDisk(uid: string): BindingCacheEntry | null {
  try {
    const raw = localStorage.getItem(bindingDiskKey(uid));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const row = parsed as {
      uid?: unknown;
      binding?: unknown;
      cachedAtMs?: unknown;
    };
    if (row.uid !== uid || typeof row.cachedAtMs !== 'number') return null;
    if (row.binding === null) {
      return { uid, binding: null, cachedAtMs: row.cachedAtMs };
    }
    // Reuse guildDoc parser so disk shape stays aligned with users/{uid} binding fields.
    const binding = parseUserGuildBinding(row.binding);
    if (!binding) return null;
    return { uid, binding, cachedAtMs: row.cachedAtMs };
  } catch {
    return null;
  }
}

function writeBindingDisk(entry: BindingCacheEntry): void {
  try {
    localStorage.setItem(bindingDiskKey(entry.uid), JSON.stringify(entry));
  } catch {
    // Quota / private mode — memory cache still works.
  }
}

function clearBindingDisk(uid?: string): void {
  try {
    if (uid) {
      localStorage.removeItem(bindingDiskKey(uid));
      return;
    }
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k?.startsWith(BINDING_DISK_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/**
 * Sync cache peek for push-wake / Crew remount — no network.
 * Prefers fresh TTL hits; still returns stale guild/binding so UI can paint instantly.
 */
export function peekCrewGuildBootstrap(
  uid: string,
  nowMs: number = Date.now()
): {
  binding: UserGuildBinding | null;
  guild: GuildDoc | null;
  bindingFresh: boolean;
  guildFresh: boolean;
} {
  if (!uid) {
    return { binding: null, guild: null, bindingFresh: false, guildFresh: false };
  }

  let entry: BindingCacheEntry | null = null;
  if (bindingMemory?.uid === uid) {
    entry = bindingMemory;
  } else {
    entry = readBindingDisk(uid);
    if (entry) bindingMemory = entry;
  }

  if (!entry?.binding) {
    return {
      binding: entry?.binding ?? null,
      guild: null,
      bindingFresh: Boolean(
        entry && nowMs - entry.cachedAtMs <= BINDING_TTL_MS
      ),
      guildFresh: false,
    };
  }

  const guildHit = lookupGuildCache(entry.binding.guildId, nowMs);
  return {
    binding: entry.binding,
    guild: guildHit?.data.guild ?? null,
    bindingFresh: nowMs - entry.cachedAtMs <= BINDING_TTL_MS,
    guildFresh: guildHit?.freshness === 'fresh',
  };
}

function diskKey(guildId: string): string {
  return `${DISK_PREFIX}${guildId}`;
}

function parseCachedAtMs(cachedAt: string): number {
  return new Date(cachedAt).getTime();
}

function isValidCacheEntry(raw: unknown): raw is GuildCacheEntry {
  if (!raw || typeof raw !== 'object') return false;
  const e = raw as GuildCacheEntry;
  return (
    Boolean(e.guild) &&
    typeof e.guild === 'object' &&
    typeof e.guild.id === 'string' &&
    typeof e.cachedAt === 'string' &&
    Number.isFinite(parseCachedAtMs(e.cachedAt))
  );
}

function readDisk(guildId: string): GuildCacheEntry | null {
  try {
    const raw = localStorage.getItem(diskKey(guildId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidCacheEntry(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeDisk(guildId: string, entry: GuildCacheEntry): void {
  try {
    localStorage.setItem(diskKey(guildId), JSON.stringify(entry));
  } catch {
    // Quota / private mode — memory cache still works.
  }
}

export function lookupGuildCache(
  guildId: string,
  nowMs: number = Date.now(),
  ttlMs: number = GUILD_LADDER_TTL_MS
): GuildCacheLookup | null {
  const mem = memory.get(guildId);
  const entry = mem ?? readDisk(guildId);
  if (!entry) return null;
  if (!mem) memory.set(guildId, entry);
  const age = nowMs - parseCachedAtMs(entry.cachedAt);
  return {
    data: entry,
    freshness: age <= ttlMs ? 'fresh' : 'stale',
  };
}

export function setGuildCache(guild: GuildDoc, cachedAt: string = new Date().toISOString()): void {
  const entry: GuildCacheEntry = { guild, cachedAt };
  memory.set(guild.id, entry);
  writeDisk(guild.id, entry);
}

export function clearGuildCache(guildId?: string): void {
  if (guildId) {
    memory.delete(guildId);
    try {
      localStorage.removeItem(diskKey(guildId));
    } catch {
      /* ignore */
    }
    return;
  }
  memory.clear();
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k?.startsWith(DISK_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Dispatched after guild ladder TTL clear so mounted Crew/Garage hooks can force-refresh. */
export const GUILD_LADDER_CACHE_INVALIDATED_EVENT = 'up-final-guild-ladder-cache-invalidated';

/**
 * Invalidate private-ladder TTL after a successful `ladderScore` upload.
 * WHY: Next Garage/Crew visit must not serve a stale members[] snapshot for 5 minutes.
 * Also notifies live `useCrewGuild` instances (upload may happen while Crew is mounted).
 */
export function invalidateGuildLadderCache(guildId?: string): void {
  clearGuildCache(guildId);
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(GUILD_LADDER_CACHE_INVALIDATED_EVENT, {
      detail: { guildId: guildId ?? null },
    })
  );
}

/** Invalidate after create / join / leave / kick / disband so Garage card stays truthful. */
export function clearUserGuildBindingCache(uid?: string): void {
  if (bindingMemory && (!uid || bindingMemory.uid === uid)) {
    bindingMemory = null;
  }
  clearBindingDisk(uid);
}

export function setUserGuildBindingCache(
  uid: string,
  binding: UserGuildBinding | null,
  nowMs: number = Date.now()
): void {
  const entry: BindingCacheEntry = { uid, binding, cachedAtMs: nowMs };
  bindingMemory = entry;
  writeBindingDisk(entry);
}

/**
 * Single getDoc for `guilds/{guildId}` — never subscribe.
 */
export async function fetchGuildDoc(
  guildId: string,
  options?: { forceRefresh?: boolean }
): Promise<FetchGuildDocResult> {
  const id = guildId.trim();
  if (!id) return { ok: false, reason: 'not-found' };

  if (!options?.forceRefresh) {
    const hit = lookupGuildCache(id);
    if (hit?.freshness === 'fresh') {
      return { ok: true, guild: hit.data.guild, fromCache: true };
    }
  }

  const db = getFirestoreDb();
  if (!db) {
    const stale = lookupGuildCache(id);
    if (stale) return { ok: true, guild: stale.data.guild, fromCache: true };
    return { ok: false, reason: 'no-db' };
  }

  try {
    const snap = await getDoc(doc(db, GUILDS_COLLECTION, id));
    if (!snap.exists()) {
      clearGuildCache(id);
      return { ok: false, reason: 'not-found' };
    }
    const guild = parseGuildDoc(snap.id, snap.data());
    if (!guild) {
      clearGuildCache(id);
      return { ok: false, reason: 'disbanded' };
    }
    setGuildCache(guild);
    return { ok: true, guild, fromCache: false };
  } catch {
    const stale = lookupGuildCache(id);
    if (stale) return { ok: true, guild: stale.data.guild, fromCache: true };
    return { ok: false, reason: 'read-error' };
  }
}

/**
 * Owner-read `users/{uid}` for guildId / guildRole.
 * Uses a short session TTL so ToolsPage + CrewPage do not double-bill on navigation.
 */
export async function fetchUserGuildBinding(
  uid: string,
  options?: { forceRefresh?: boolean }
): Promise<UserGuildBinding | null> {
  if (!uid) return null;
  const nowMs = Date.now();
  if (!options?.forceRefresh) {
    if (
      bindingMemory &&
      bindingMemory.uid === uid &&
      nowMs - bindingMemory.cachedAtMs <= BINDING_TTL_MS
    ) {
      return bindingMemory.binding;
    }
    const disk = readBindingDisk(uid);
    if (disk && nowMs - disk.cachedAtMs <= BINDING_TTL_MS) {
      bindingMemory = disk;
      return disk.binding;
    }
  }

  const db = getFirestoreDb();
  if (!db) {
    if (bindingMemory?.uid === uid) return bindingMemory.binding;
    const disk = readBindingDisk(uid);
    return disk?.binding ?? null;
  }
  try {
    const snap = await getDoc(doc(db, USER_CLOUD_COLLECTION, uid));
    if (!snap.exists()) {
      setUserGuildBindingCache(uid, null, nowMs);
      return null;
    }
    const binding = parseUserGuildBinding(snap.data());
    setUserGuildBindingCache(uid, binding, nowMs);
    return binding;
  } catch {
    if (bindingMemory?.uid === uid) return bindingMemory.binding;
    const disk = readBindingDisk(uid);
    return disk?.binding ?? null;
  }
}
