type TimerHandle = ReturnType<typeof setTimeout>;

export interface StructuredSyncSession {
  uid: string;
  generation: number;
}

let activeUid: string | null = null;
let generation = 0;
const pendingTimers = new Set<TimerHandle>();

/**
 * Auth transitions invalidate every deferred cloud write before local state can
 * be rebound to another account. This prevents old-session payloads from being
 * committed under the next Firebase user.
 */
export function bindStructuredSyncSession(uid: string | null): void {
  if (uid === activeUid) return;
  activeUid = uid;
  generation += 1;
  for (const timer of pendingTimers) {
    clearTimeout(timer);
  }
  pendingTimers.clear();
}

export function captureStructuredSyncSession(): StructuredSyncSession | null {
  if (!activeUid) return null;
  return { uid: activeUid, generation };
}

export function isStructuredSyncSessionCurrent(session: StructuredSyncSession): boolean {
  return session.uid === activeUid && session.generation === generation;
}

export function registerStructuredSyncTimer(timer: TimerHandle): void {
  pendingTimers.add(timer);
}

export function releaseStructuredSyncTimer(timer: TimerHandle): void {
  pendingTimers.delete(timer);
}
