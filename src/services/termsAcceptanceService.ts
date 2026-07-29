import { doc, setDoc } from 'firebase/firestore';
import {
  HEALTH_TERMS_VERSION,
  isTermsAcceptedFlag,
  termsAcceptedStorageKey,
  type HealthTermsVersion,
} from '../logic/core/termsAcceptance';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';
import { getCurrentFirebaseUser, getFirestoreDb } from './firebaseClient';
import { USER_CLOUD_COLLECTION } from './firestorePaths';

function termsAcceptedAtStorageKey(version: HealthTermsVersion): string {
  return `${termsAcceptedStorageKey(version)}.at`;
}

export function hasAcceptedHealthTerms(
  version: HealthTermsVersion = HEALTH_TERMS_VERSION
): boolean {
  return isTermsAcceptedFlag(safeGetItem(termsAcceptedStorageKey(version)));
}

/**
 * Persist acceptance locally. Returns ISO timestamp used for optional cloud audit fields.
 */
export function markHealthTermsAccepted(
  version: HealthTermsVersion = HEALTH_TERMS_VERSION
): { acceptedAt: string } {
  const acceptedAt = new Date().toISOString();
  safeSetItem(termsAcceptedStorageKey(version), '1');
  safeSetItem(termsAcceptedAtStorageKey(version), acceptedAt);
  return { acceptedAt };
}

/**
 * Best-effort audit sync for non-anonymous Google sessions.
 * WHY: local flag is the product gate; cloud fields are forensic only and must not block UX.
 */
export async function syncHealthTermsAcceptanceToUserDoc(input: {
  version?: HealthTermsVersion;
  acceptedAt: string;
}): Promise<boolean> {
  const version = input.version ?? HEALTH_TERMS_VERSION;
  const user = getCurrentFirebaseUser();
  if (!user || user.isAnonymous) return false;
  const db = getFirestoreDb();
  if (!db) return false;
  try {
    await setDoc(
      doc(db, USER_CLOUD_COLLECTION, user.uid),
      {
        termsAcceptedVersion: version,
        termsAcceptedAt: input.acceptedAt,
      },
      { merge: true }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Local stamp + fire-and-forget cloud audit.
 * WHY: Never await Firestore on the critical consent path — weak networks must not trap the gate/modal.
 */
export function persistHealthTermsAcceptance(
  version: HealthTermsVersion = HEALTH_TERMS_VERSION
): { acceptedAt: string } {
  const { acceptedAt } = markHealthTermsAccepted(version);
  void syncHealthTermsAcceptanceToUserDoc({ version, acceptedAt });
  return { acceptedAt };
}

/**
 * If this device already accepted terms and the session is a real Google user, backfill audit fields.
 * WHY: Guest→Google upgrade / Settings sign-in never re-runs AuthChoice consent; local flag alone would leave User Doc empty.
 */
export function syncAcceptedHealthTermsToCloudIfNeeded(
  version: HealthTermsVersion = HEALTH_TERMS_VERSION
): void {
  if (!hasAcceptedHealthTerms(version)) return;
  const acceptedAt =
    safeGetItem(termsAcceptedAtStorageKey(version)) ?? new Date().toISOString();
  void syncHealthTermsAcceptanceToUserDoc({ version, acceptedAt });
}
