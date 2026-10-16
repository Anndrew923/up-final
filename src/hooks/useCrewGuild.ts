import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { hasProAccess } from '../logic/core/entitlement';
import {
  normalizeGuildNameClient,
  normalizeGuildTagClient,
  sortGuildMembersByScore,
} from '../logic/core/guildDoc';
import { resolveGuildCallableIdentity } from '../services/ladderAvatarStorageService';
import { getMergedScoresSnapshotForRadar } from '../services/mergedLocalScoresSnapshot';
import {
  createGuild,
  disbandGuild,
  joinGuild,
  kickGuildMember,
  leaveGuild,
  renameGuild,
  type GuildCallableFailureReason,
  type GuildCallableResult,
} from '../services/guildCallableService';
import { sanitizeGuildRadarScores } from '../logic/core/guildRadarScores';
import {
  clearGuildCache,
  clearUserGuildBindingCache,
  fetchGuildDoc,
  fetchUserGuildBinding,
  GUILD_LADDER_CACHE_INVALIDATED_EVENT,
} from '../services/guildLadderCacheService';
import type { GuildDoc, GuildMemberSnapshot, GuildRole } from '../types/guild';
import { useAuthStore } from '../stores/authStore';
import { selectEntitlementState } from '../stores/entitlementSelectors';
import { useEntitlementStore } from '../stores/entitlementStore';
import { useScoreStore } from '../stores/scoreStore';

export type CrewLoadStatus = 'idle' | 'loading' | 'ready' | 'error' | 'empty';

export interface UseCrewGuildResult {
  status: CrewLoadStatus;
  guild: GuildDoc | null;
  role: GuildRole | null;
  isCoach: boolean;
  isPro: boolean;
  rankedMembers: GuildMemberSnapshot[];
  authUid: string | null;
  /** True while a Callable mutation is in flight. */
  busy: boolean;
  /** True while a guild/doc refresh is in flight (independent of mutations). */
  refreshing: boolean;
  actionError: GuildCallableFailureReason | null;
  clearActionError: () => void;
  refresh: (force?: boolean) => Promise<void>;
  create: (input: { name: string; tag: string }) => Promise<GuildCallableResult>;
  join: (code: string) => Promise<GuildCallableResult>;
  leave: () => Promise<GuildCallableResult>;
  kick: (targetUid: string) => Promise<GuildCallableResult>;
  rename: (input: { name?: string; tag?: string }) => Promise<GuildCallableResult>;
  disband: () => Promise<GuildCallableResult>;
}

export function useCrewGuild(): UseCrewGuildResult {
  const authUid = useAuthStore((s) => s.uid);
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const isPro = hasProAccess(entitlement);

  const [status, setStatus] = useState<CrewLoadStatus>('idle');
  const [guild, setGuild] = useState<GuildDoc | null>(null);
  const [role, setRole] = useState<GuildRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<GuildCallableFailureReason | null>(null);

  /** Monotonic load generation — drops stale async results after uid change / remount. */
  const loadGenRef = useRef(0);
  const guildIdRef = useRef<string | null>(null);
  guildIdRef.current = guild?.id ?? null;

  const clearActionError = useCallback(() => setActionError(null), []);

  const refresh = useCallback(
    async (force = false) => {
      const gen = ++loadGenRef.current;

      if (!authUid) {
        if (gen !== loadGenRef.current) return;
        setGuild(null);
        setRole(null);
        setStatus('empty');
        setRefreshing(false);
        return;
      }

      setRefreshing(true);
      setStatus((prev) => (prev === 'ready' ? prev : 'loading'));

      try {
        const binding = await fetchUserGuildBinding(authUid, { forceRefresh: force });
        if (gen !== loadGenRef.current) return;

        if (!binding) {
          setGuild(null);
          setRole(null);
          setStatus('empty');
          return;
        }

        setRole(binding.guildRole);
        const result = await fetchGuildDoc(binding.guildId, { forceRefresh: force });
        if (gen !== loadGenRef.current) return;

        if (!result.ok) {
          // WHY: Stale binding after kick/disband must surface as empty HQ, not a permanent load error.
          if (result.reason === 'not-found' || result.reason === 'disbanded') {
            clearUserGuildBindingCache(authUid);
            setGuild(null);
            setRole(null);
            setStatus('empty');
            return;
          }
          setGuild(null);
          setStatus('error');
          return;
        }

        setGuild(result.guild);
        setStatus('ready');
      } finally {
        if (gen === loadGenRef.current) {
          setRefreshing(false);
        }
      }
    },
    [authUid]
  );

  useEffect(() => {
    void refresh(false);
    return () => {
      // Invalidate in-flight loads when uid changes or hook unmounts.
      loadGenRef.current += 1;
    };
  }, [refresh]);

  // WHY: Ladder upload clears guild TTL while Crew/Garage may still be mounted — force re-read.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onInvalidated = () => {
      void refresh(true);
    };
    window.addEventListener(GUILD_LADDER_CACHE_INVALIDATED_EVENT, onInvalidated);
    return () => {
      window.removeEventListener(GUILD_LADDER_CACHE_INVALIDATED_EVENT, onInvalidated);
    };
  }, [refresh]);

  const rankedMembers = useMemo(
    () => (guild ? sortGuildMembersByScore(guild.members) : []),
    [guild]
  );

  const runMutation = useCallback(
    async (
      op: () => Promise<GuildCallableResult>,
      options?: { clearCacheGuildId?: string | null }
    ): Promise<GuildCallableResult> => {
      setBusy(true);
      setActionError(null);
      try {
        const result = await op();
        if (!result.ok) {
          setActionError(result.reason);
          // WHY: Cross-device join leaves local binding null → empty HQ + already-in-guild forever until TTL.
          if (result.reason === 'already-in-guild' && authUid) {
            clearUserGuildBindingCache(authUid);
            await refresh(true);
          }
          return result;
        }
        const cacheGuildId = options?.clearCacheGuildId ?? guildIdRef.current;
        if (cacheGuildId) clearGuildCache(cacheGuildId);
        if (authUid) clearUserGuildBindingCache(authUid);
        await refresh(true);
        return result;
      } finally {
        setBusy(false);
      }
    },
    [authUid, refresh]
  );

  const create = useCallback(
    async (input: { name: string; tag: string }) => {
      if (!isPro) {
        const fail = { ok: false as const, reason: 'pro-required' as const };
        setActionError(fail.reason);
        return fail;
      }
      const nameResult = normalizeGuildNameClient(input.name);
      const tagResult = normalizeGuildTagClient(input.tag);
      if (!nameResult.ok) {
        const fail = { ok: false as const, reason: 'invalid-name' as const };
        setActionError(fail.reason);
        return fail;
      }
      if (!tagResult.ok) {
        const fail = { ok: false as const, reason: 'invalid-tag' as const };
        setActionError(fail.reason);
        return fail;
      }
      const identity = await resolveGuildCallableIdentity();
      const ladderScore = useScoreStore.getState().overallScore;
      const radarScores = sanitizeGuildRadarScores(getMergedScoresSnapshotForRadar());
      return runMutation(() =>
        createGuild({
          name: nameResult.name,
          tag: tagResult.tag,
          ...identity,
          ladderScore: Number.isFinite(ladderScore) ? ladderScore : 0,
          ...(radarScores ? { radarScores } : {}),
        })
      );
    },
    [isPro, runMutation]
  );

  const join = useCallback(
    async (code: string) => {
      const identity = await resolveGuildCallableIdentity();
      const ladderScore = useScoreStore.getState().overallScore;
      const radarScores = sanitizeGuildRadarScores(getMergedScoresSnapshotForRadar());
      return runMutation(() =>
        joinGuild({
          code,
          ...identity,
          ladderScore: Number.isFinite(ladderScore) ? ladderScore : 0,
          ...(radarScores ? { radarScores } : {}),
        })
      );
    },
    [runMutation]
  );

  const leave = useCallback(async () => {
    return runMutation(() => leaveGuild(), { clearCacheGuildId: guildIdRef.current });
  }, [runMutation]);

  const kick = useCallback(
    async (targetUid: string) => runMutation(() => kickGuildMember(targetUid)),
    [runMutation]
  );

  const rename = useCallback(
    async (input: { name?: string; tag?: string }) => {
      const payload: { name?: string; tag?: string } = {};
      if (input.name != null) {
        const nameResult = normalizeGuildNameClient(input.name);
        if (!nameResult.ok) {
          const fail = { ok: false as const, reason: 'invalid-name' as const };
          setActionError(fail.reason);
          return fail;
        }
        payload.name = nameResult.name;
      }
      if (input.tag != null) {
        const tagResult = normalizeGuildTagClient(input.tag);
        if (!tagResult.ok) {
          const fail = { ok: false as const, reason: 'invalid-tag' as const };
          setActionError(fail.reason);
          return fail;
        }
        payload.tag = tagResult.tag;
      }
      return runMutation(() => renameGuild(payload));
    },
    [runMutation]
  );

  const disband = useCallback(async () => {
    return runMutation(() => disbandGuild(), { clearCacheGuildId: guildIdRef.current });
  }, [runMutation]);

  return {
    status,
    guild,
    role,
    isCoach: role === 'coach' || (guild != null && authUid != null && guild.coachUid === authUid),
    isPro,
    rankedMembers,
    authUid,
    busy,
    refreshing,
    actionError,
    clearActionError,
    refresh,
    create,
    join,
    leave,
    kick,
    rename,
    disband,
  };
}
