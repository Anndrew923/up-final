import { doc, getDoc } from 'firebase/firestore';
import { getCurrentFirebaseUser, getFirestoreDb } from './firebaseClient';
import { USER_CLOUD_COLLECTION } from './firestorePaths';

/** Session cache — admin flag almost never flips mid-session; avoid repeat reads. */
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000;

type AdminEntitlementCache = {
  uid: string;
  isAdmin: boolean;
  cachedAt: number;
};

let adminEntitlementCache: AdminEntitlementCache | null = null;

export function clearAdminEntitlementCache(): void {
  adminEntitlementCache = null;
}

/**
 * Read `users/{uid}.isAdmin` for the signed-in Google user.
 * WHY: Admin UI entry must stay hidden for non-admins; owner-read is allowed by rules.
 */
export async function fetchCurrentUserIsAdmin(): Promise<boolean> {
  const user = getCurrentFirebaseUser();
  if (!user || user.isAnonymous) {
    adminEntitlementCache = null;
    return false;
  }

  const now = Date.now();
  if (
    adminEntitlementCache &&
    adminEntitlementCache.uid === user.uid &&
    now - adminEntitlementCache.cachedAt < ADMIN_CACHE_TTL_MS
  ) {
    return adminEntitlementCache.isAdmin;
  }

  const db = getFirestoreDb();
  if (!db) return false;
  try {
    const snap = await getDoc(doc(db, USER_CLOUD_COLLECTION, user.uid));
    const isAdmin = snap.exists() && snap.data()?.isAdmin === true;
    adminEntitlementCache = { uid: user.uid, isAdmin, cachedAt: now };
    return isAdmin;
  } catch {
    return false;
  }
}
