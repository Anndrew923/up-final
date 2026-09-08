import { doc, getDoc } from 'firebase/firestore';
import {
  parseGenesisEarlyBirdFromUserDoc,
  parseServerProFromUserDoc,
  type FirestoreUserEntitlementFields,
  type ParsedGenesisEarlyBird,
  type ParsedServerProEntitlement,
} from '../logic/core/userEntitlementDoc';
import {
  hasProAccess,
  shouldBlockCrossPlatformProDowngrade,
} from '../logic/core/entitlement';
import { parseRedeemedReferrerCode } from '../logic/core/promoCode';
import type { EntitlementState } from '../types/entitlement';
import { getFirestoreDb } from './firebaseClient';
import { USER_CLOUD_COLLECTION } from './firestorePaths';

export function logEntitlementSync(phase: string, detail?: Record<string, unknown>): void {
  if (detail && Object.keys(detail).length > 0) {
    console.info('[entitlement-sync]', phase, detail);
    return;
  }
  console.info('[entitlement-sync]', phase);
}

export type ServerProHydrateResult =
  | {
      status: 'active';
      entitlement: ParsedServerProEntitlement;
      genesis: ParsedGenesisEarlyBird;
    }
  /**
   * User doc exists but has no valid Pro — authoritative server revocation.
   * WHY: Webhook/cancel must beat stale uid-scoped localStorage on next login.
   * Genesis mirror still applies (lifetime ladder seats survive Pro lapse).
   */
  | { status: 'revoked'; genesis: ParsedGenesisEarlyBird }
  /** Missing doc, offline, or Firestore unavailable — do not mutate local Pro. */
  | { status: 'skipped'; reason: 'no-db-or-uid' | 'doc-missing' | 'read-error' };

/**
 * Last successful `users/{uid}` referrer parse in this JS session.
 * WHY: Auth bootstrap hydrates then binds — a second getDoc for RC backfill is wasted spend.
 */
let lastHydratedReferrer: { uid: string; code: string | null } | null = null;

function rememberHydratedReferrer(uid: string, code: string | null): void {
  lastHydratedReferrer = { uid, code };
}

/**
 * Read authoritative Pro + Genesis fields from `users/{uid}` (owner-read allowed by rules).
 * WHY: Cross-platform SSOT — Android purchase must unlock iOS without local StoreKit receipt.
 * Scheme A: same doc also carries founding-seat mirror for ladder lifetime free.
 */
export async function resolveServerProHydrate(uid: string): Promise<ServerProHydrateResult> {
  const db = getFirestoreDb();
  if (!db || !uid) {
    logEntitlementSync('firestore-hydrate-skipped', { reason: 'no-db-or-uid' });
    return { status: 'skipped', reason: 'no-db-or-uid' };
  }

  try {
    const snap = await getDoc(doc(db, USER_CLOUD_COLLECTION, uid));
    if (!snap.exists()) {
      rememberHydratedReferrer(uid, null);
      logEntitlementSync('firestore-hydrate-miss', { uid, reason: 'doc-missing' });
      return { status: 'skipped', reason: 'doc-missing' };
    }

    const data = snap.data() as FirestoreUserEntitlementFields;
    rememberHydratedReferrer(uid, parseRedeemedReferrerCode(data));
    const genesis = parseGenesisEarlyBirdFromUserDoc(data);
    const parsed = parseServerProFromUserDoc(data);
    if (parsed) {
      logEntitlementSync('firestore-hydrate-hit', {
        uid,
        subscriptionStatus: parsed.subscriptionStatus,
        proExpiresAt: parsed.proExpiresAt,
        isGenesisEarlyBird: genesis.isGenesisEarlyBird,
      });
      return { status: 'active', entitlement: parsed, genesis };
    }

    logEntitlementSync('firestore-hydrate-revoked', {
      uid,
      isGenesisEarlyBird: genesis.isGenesisEarlyBird,
    });
    return { status: 'revoked', genesis };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logEntitlementSync('firestore-hydrate-error', { uid, message });
    return { status: 'skipped', reason: 'read-error' };
  }
}

/** Active-only convenience wrapper for callers that only need a Pro grant payload. */
export async function fetchServerProEntitlement(
  uid: string
): Promise<ParsedServerProEntitlement | null> {
  const result = await resolveServerProHydrate(uid);
  return result.status === 'active' ? result.entitlement : null;
}

/**
 * Owner-readable denormalized referrer on `users/{uid}`.
 * WHY: Native bind cannot read Admin-only `user_attributions`.
 */
export async function fetchRedeemedReferrerCode(uid: string): Promise<string | null> {
  if (!uid) return null;
  if (lastHydratedReferrer?.uid === uid) return lastHydratedReferrer.code;
  const db = getFirestoreDb();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, USER_CLOUD_COLLECTION, uid));
    if (!snap.exists()) {
      rememberHydratedReferrer(uid, null);
      return null;
    }
    const code = parseRedeemedReferrerCode(snap.data() as FirestoreUserEntitlementFields);
    rememberHydratedReferrer(uid, code);
    return code;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logEntitlementSync('referrer-read-error', { uid, message });
    return null;
  }
}

/**
 * Re-check Firestore before honoring cross-platform downgrade guards.
 * WHY: Webhook revocation must propagate on refresh even when the local store is inactive.
 */
export async function shouldPreserveLocalProAgainstInactiveStore(
  uid: string,
  ent: EntitlementState,
  snapshotActive: boolean
): Promise<boolean> {
  if (!shouldBlockCrossPlatformProDowngrade(ent, snapshotActive)) return false;

  const server = await resolveServerProHydrate(uid);
  if (server.status === 'revoked') return false;
  return hasProAccess(ent);
}
