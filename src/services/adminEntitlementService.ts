import { doc, getDoc } from 'firebase/firestore';
import { getCurrentFirebaseUser, getFirestoreDb } from './firebaseClient';
import { USER_CLOUD_COLLECTION } from './firestorePaths';

/**
 * Read `users/{uid}.isAdmin` for the signed-in Google user.
 * WHY: Admin UI entry must stay hidden for non-admins; owner-read is allowed by rules.
 */
export async function fetchCurrentUserIsAdmin(): Promise<boolean> {
  const user = getCurrentFirebaseUser();
  if (!user || user.isAnonymous) return false;
  const db = getFirestoreDb();
  if (!db) return false;
  try {
    const snap = await getDoc(doc(db, USER_CLOUD_COLLECTION, user.uid));
    if (!snap.exists()) return false;
    return snap.data()?.isAdmin === true;
  } catch {
    return false;
  }
}
