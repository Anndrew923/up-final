/**
 * Imperative navigate bridge for push action handlers (outside React tree).
 * WHY: Capacitor listeners live in services; React Router navigate must be registered by a hook.
 * Cold-start taps can fire before AppShell mounts — queue one pending route until the handler lands.
 */

export type PushNavigateHandler = (to: string) => void;

let navigateHandler: PushNavigateHandler | null = null;
let pendingRoute: string | null = null;

export function registerPushNavigateHandler(handler: PushNavigateHandler): void {
  navigateHandler = handler;
  if (!pendingRoute) return;
  const route = pendingRoute;
  pendingRoute = null;
  handler(route);
}

export function unregisterPushNavigateHandler(handler?: PushNavigateHandler): void {
  if (handler && navigateHandler !== handler) return;
  navigateHandler = null;
}

/**
 * Navigate now, or queue until a handler registers.
 * @returns true when delivered or queued; false only if `to` is empty.
 */
export function navigateFromPushRoute(to: string): boolean {
  const trimmed = typeof to === 'string' ? to.trim() : '';
  if (!trimmed) return false;
  if (!navigateHandler) {
    // WHY: Keep last tap only — multiple cold-start events are rare; newest intent wins.
    pendingRoute = trimmed;
    return true;
  }
  navigateHandler(trimmed);
  return true;
}

/** Test seam — clear module state between unit tests. */
export function __resetPushNavigationBridgeForTests(): void {
  navigateHandler = null;
  pendingRoute = null;
}
