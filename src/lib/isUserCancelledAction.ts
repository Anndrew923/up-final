/**
 * Detect OS / Web Share "user dismissed" errors.
 *
 * WHY: Camera, Share Sheet, and navigator.share all surface cancel differently.
 * Permission denials must NOT match — those are real failures for the caller to handle.
 */
export function isUserCancelledAction(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === 'object' && err !== null && 'name' in err) {
    const name = String((err as { name: unknown }).name);
    // AbortError = user dismissed Web Share / picker. NotAllowedError = permission — not cancel.
    if (name === 'AbortError') return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /cancel|abort|dismiss/i.test(msg);
}
