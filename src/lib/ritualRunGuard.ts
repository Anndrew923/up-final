/**
 * Abort guard for async UI rituals keyed by a monotonic run id.
 * WHY: Superseding runs bump the ref without closing UI; only stale runs must avoid
 * calling `close` or they would kill the replacement overlay (Home resonance boot freeze).
 */
export function exitIfRunCancelled(
  runId: number,
  runIdRef: { current: number },
  close: () => void
): boolean {
  if (runId === runIdRef.current) return false;
  if (runIdRef.current > runId) return true;
  close();
  return true;
}
