import { doc, getDoc } from 'firebase/firestore';
import {
  parseServerProFromUserDoc,
  type FirestoreUserEntitlementFields,
  type ParsedServerProEntitlement,
} from '../logic/core/userEntitlementDoc';
import { hasProAccess, shouldBlockCrossPlatformProDowngrade } from '../logic/core/entitlement';
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
  | { status: 'active'; entitlement: ParsedServerProEntitlement }
  /**
   * User doc exists but has no valid Pro — authoritative server revocation.
   * WHY: Webhook/cancel must beat stale uid-scoped localStorage on next login.
   */
  | { status: 'revoked' }
  /** Missing doc, offline, or Firestore unavailable — do not mutate local Pro. */
  | { status: 'skipped'; reason: 'no-db-or-uid' | 'doc-missing' | 'read-error' };

/**
 * Read authoritative Pro fields from `users/{uid}` (owner-read allowed by rules).
 * WHY: Cross-platform SSOT — Android purchase must unlock iOS without local StoreKit receipt.
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
      logEntitlementSync('firestore-hydrate-miss', { uid, reason: 'doc-missing' });
      return { status: 'skipped', reason: 'doc-missing' };
    }

    const parsed = parseServerProFromUserDoc(snap.data() as FirestoreUserEntitlementFields);
    if (parsed) {
      logEntitlementSync('firestore-hydrate-hit', {
        uid,
        subscriptionStatus: parsed.subscriptionStatus,
        proExpiresAt: parsed.proExpiresAt,
      });
      return { status: 'active', entitlement: parsed };
    }

    logEntitlementSync('firestore-hydrate-revoked', { uid });
    return { status: 'revoked' };
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
