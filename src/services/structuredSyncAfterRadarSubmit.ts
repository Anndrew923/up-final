import { queueStructuredProfilePushFromCurrentEntitlement } from './userStructuredSyncService';

const DEBOUNCE_MS = 600;

/**
 * Call after any successful assessment "write to radar" so Pro structured profile syncs to Firestore (debounced).
 */
export function queueStructuredProfileAfterRadarSubmit(): void {
  queueStructuredProfilePushFromCurrentEntitlement(DEBOUNCE_MS);
}
