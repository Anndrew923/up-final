/**
 * Sync intent gates for post-purchase vs restore/refresh reconciliation.
 */

/**
 * @param {unknown} raw
 * @returns {'activate' | 'reconcile'}
 */
export function normalizeSyncProIntent(raw) {
  return raw === "activate" ? "activate" : "reconcile";
}

/**
 * @param {'activate' | 'reconcile'} intent
 * @returns {boolean}
 */
export function shouldClearProWhenRevenueCatInactive(intent) {
  // WHY: Post-purchase `activate` retries often see RC REST lag. Clearing would
  // race a webhook that just wrote Pro and wipe the authoritative server grant.
  return intent !== "activate";
}
