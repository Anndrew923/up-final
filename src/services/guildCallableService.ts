/**
 * Crew / guild mutations — Callable only (never client Firestore writes).
 */
import { httpsCallable } from 'firebase/functions';
import { normalizeInviteCode } from '../logic/core/guildInviteCode';
import { ensureFreshAppCheckToken } from './firebaseAppCheck';
import { ensureFreshFirebaseIdToken, getFirebaseFunctions } from './firebaseClient';

export type GuildCallableFailureReason =
  | 'auth-required'
  | 'pro-required'
  | 'already-in-guild'
  | 'not-in-guild'
  | 'not-coach'
  | 'coach-cannot-leave'
  | 'guild-full'
  | 'invalid-code'
  | 'invalid-name'
  | 'invalid-tag'
  | 'not-found'
  | 'rate-limited'
  | 'cannot-kick-self'
  | 'app-check'
  | 'unavailable'
  | 'failed';

export type GuildCallableResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; reason: GuildCallableFailureReason };

type CreateGuildResponse = {
  ok: boolean;
  guildId?: string;
  inviteCode?: string;
  name?: string;
  tag?: string;
  error?: string;
};

type JoinGuildResponse = {
  ok: boolean;
  guildId?: string;
  name?: string;
  tag?: string;
  memberCount?: number;
  error?: string;
};

type MutateGuildResponse = {
  ok: boolean;
  error?: string;
};

async function prepareGuildCallableSession(): Promise<void> {
  await Promise.all([ensureFreshFirebaseIdToken(), ensureFreshAppCheckToken(true)]);
}

/**
 * Map Firebase Callable code+message into UI reasons.
 * Exported for unit tests — keep in sync with functions/guild/* HttpsError messages.
 */
export function mapGuildCallableError(raw: string): GuildCallableFailureReason {
  const text = raw.toLowerCase();
  if (text.includes('app check') || text.includes('appcheck') || text.includes('attestation')) {
    return 'app-check';
  }
  if (text.includes('unauthenticated')) return 'auth-required';
  if (text.includes('pro-required')) return 'pro-required';
  if (text.includes('already-in-guild')) return 'already-in-guild';
  if (text.includes('not-in-guild')) return 'not-in-guild';
  if (text.includes('not-coach')) return 'not-coach';
  if (text.includes('coach-cannot-leave')) return 'coach-cannot-leave';
  if (text.includes('guild-join-rate-limited') || text.includes('rate-limited')) {
    return 'rate-limited';
  }
  if (text.includes('guild-full')) return 'guild-full';
  if (text.includes('invite-code-mint-exhausted')) return 'failed';
  if (text.includes('invalid-code')) return 'invalid-code';
  if (text.includes('invalid-name')) return 'invalid-name';
  if (text.includes('invalid-tag')) return 'invalid-tag';
  if (text.includes('cannot-kick-self')) return 'cannot-kick-self';
  if (text.includes('not-found')) return 'not-found';
  if (text.includes('permission-denied')) return 'not-coach';
  if (text.includes('unavailable')) return 'unavailable';
  if (text.includes('resource-exhausted')) return 'rate-limited';
  return 'failed';
}

function callableErrorRaw(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err);
  const code = 'code' in err ? String((err as { code?: string }).code ?? '') : '';
  const message = 'message' in err ? String((err as { message?: string }).message ?? '') : '';
  return `${code} ${message}`.trim();
}

function functionsUnavailable(): GuildCallableResult<never> {
  return { ok: false, reason: 'unavailable' };
}

/**
 * Pro-only: create a crew (1 user = 1 crew ownership via Single Guild Guard).
 */
export async function createGuild(input: {
  name: string;
  tag: string;
  displayName?: string;
  avatarUrl?: string;
  ladderScore?: number;
}): Promise<GuildCallableResult<{ guildId: string; inviteCode: string; name: string; tag: string }>> {
  const functions = getFirebaseFunctions();
  if (!functions) return functionsUnavailable();
  try {
    await prepareGuildCallableSession();
    const callable = httpsCallable<typeof input, CreateGuildResponse>(functions, 'createGuild');
    const { data } = await callable(input);
    if (data.ok === true && data.guildId && data.inviteCode && data.name && data.tag) {
      return {
        ok: true,
        guildId: data.guildId,
        inviteCode: data.inviteCode,
        name: data.name,
        tag: data.tag,
      };
    }
    return { ok: false, reason: mapGuildCallableError(data.error ?? 'failed') };
  } catch (err) {
    return { ok: false, reason: mapGuildCallableError(callableErrorRaw(err)) };
  }
}

/** Free users may join with an invite code; Single Guild Guard enforced server-side. */
export async function joinGuild(input: {
  code: string;
  displayName?: string;
  avatarUrl?: string;
  ladderScore?: number;
}): Promise<
  GuildCallableResult<{ guildId: string; name: string; tag: string; memberCount: number }>
> {
  const functions = getFirebaseFunctions();
  if (!functions) return functionsUnavailable();
  const payload = { ...input, code: normalizeInviteCode(input.code) };
  try {
    await prepareGuildCallableSession();
    const callable = httpsCallable<typeof payload, JoinGuildResponse>(functions, 'joinGuild');
    const { data } = await callable(payload);
    if (
      data.ok === true &&
      data.guildId &&
      data.name &&
      data.tag &&
      typeof data.memberCount === 'number'
    ) {
      return {
        ok: true,
        guildId: data.guildId,
        name: data.name,
        tag: data.tag,
        memberCount: data.memberCount,
      };
    }
    return { ok: false, reason: mapGuildCallableError(data.error ?? 'failed') };
  } catch (err) {
    return { ok: false, reason: mapGuildCallableError(callableErrorRaw(err)) };
  }
}

/** Members only — coaches must `disbandGuild`. */
export async function leaveGuild(): Promise<GuildCallableResult> {
  const functions = getFirebaseFunctions();
  if (!functions) return functionsUnavailable();
  try {
    await prepareGuildCallableSession();
    const callable = httpsCallable<Record<string, never>, MutateGuildResponse>(
      functions,
      'leaveGuild'
    );
    const { data } = await callable({});
    if (data.ok === true) return { ok: true };
    return { ok: false, reason: mapGuildCallableError(data.error ?? 'failed') };
  } catch (err) {
    return { ok: false, reason: mapGuildCallableError(callableErrorRaw(err)) };
  }
}

/** Coach-only kick. */
export async function kickGuildMember(targetUid: string): Promise<GuildCallableResult> {
  const functions = getFirebaseFunctions();
  if (!functions) return functionsUnavailable();
  try {
    await prepareGuildCallableSession();
    const callable = httpsCallable<{ targetUid: string }, MutateGuildResponse>(
      functions,
      'kickGuildMember'
    );
    const { data } = await callable({ targetUid });
    if (data.ok === true) return { ok: true };
    return { ok: false, reason: mapGuildCallableError(data.error ?? 'failed') };
  } catch (err) {
    return { ok: false, reason: mapGuildCallableError(callableErrorRaw(err)) };
  }
}

/** Coach-only rename (name and/or tag). */
export async function renameGuild(input: {
  name?: string;
  tag?: string;
}): Promise<GuildCallableResult<{ name: string; tag: string }>> {
  const functions = getFirebaseFunctions();
  if (!functions) return functionsUnavailable();
  try {
    await prepareGuildCallableSession();
    const callable = httpsCallable<
      typeof input,
      MutateGuildResponse & { name?: string; tag?: string }
    >(functions, 'renameGuild');
    const { data } = await callable(input);
    if (data.ok === true && data.name && data.tag) {
      return { ok: true, name: data.name, tag: data.tag };
    }
    return { ok: false, reason: mapGuildCallableError(data.error ?? 'failed') };
  } catch (err) {
    return { ok: false, reason: mapGuildCallableError(callableErrorRaw(err)) };
  }
}

/** Coach-only disband — clears all members' guild fields + invite lookup. */
export async function disbandGuild(): Promise<GuildCallableResult> {
  const functions = getFirebaseFunctions();
  if (!functions) return functionsUnavailable();
  try {
    await prepareGuildCallableSession();
    const callable = httpsCallable<Record<string, never>, MutateGuildResponse>(
      functions,
      'disbandGuild'
    );
    const { data } = await callable({});
    if (data.ok === true) return { ok: true };
    return { ok: false, reason: mapGuildCallableError(data.error ?? 'failed') };
  } catch (err) {
    return { ok: false, reason: mapGuildCallableError(callableErrorRaw(err)) };
  }
}

type SyncGuildScoreResponse = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  guildId?: string | null;
  ladderScore?: number;
  error?: string;
};

/**
 * Privacy Phase 1 — update crew private ladder overall score only.
 * Free members allowed; never writes public leaderboard shards.
 */
export async function syncGuildLadderScore(input: {
  ladderScore: number;
  displayName?: string;
  avatarUrl?: string;
  isAnonymous?: boolean;
}): Promise<
  GuildCallableResult<{
    skipped: boolean;
    guildId: string | null;
    ladderScore?: number;
    skipReason?: string;
  }>
> {
  const functions = getFirebaseFunctions();
  if (!functions) return functionsUnavailable();
  try {
    await prepareGuildCallableSession();
    const callable = httpsCallable<typeof input, SyncGuildScoreResponse>(
      functions,
      'syncGuildLadderScore'
    );
    const { data } = await callable(input);
    if (data.ok === true) {
      return {
        ok: true,
        skipped: data.skipped === true,
        guildId: data.guildId ?? null,
        ladderScore: data.ladderScore,
        skipReason: typeof data.reason === 'string' ? data.reason : undefined,
      };
    }
    return {
      ok: false,
      reason: mapGuildCallableError(data.error ?? data.reason ?? 'failed'),
    };
  } catch (err) {
    return { ok: false, reason: mapGuildCallableError(callableErrorRaw(err)) };
  }
}
