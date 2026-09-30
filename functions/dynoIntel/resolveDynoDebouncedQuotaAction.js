/**
 * Pure gate for same-question debounce vs quota burn.
 * WHY: Concurrent Spectrum/client re-entry used to fall through when cache was still
 * cold and burn a second daily seat while the first inference was still writing.
 *
 * @returns {'replay-cache' | 'block-in-flight' | 'allow-consume'}
 */
export function resolveDynoDebouncedQuotaAction({ debounced, hasCachedReply, pendingReservationCount }) {
  if (!debounced) return "allow-consume";
  if (hasCachedReply) return "replay-cache";
  // First attempt still holding a reservation — never open a second seat.
  if (Number(pendingReservationCount) > 0) return "block-in-flight";
  // First attempt released without a cache write — allow one legitimate retry.
  return "allow-consume";
}
