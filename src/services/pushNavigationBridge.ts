/**
 * Imperative navigate bridge for push action handlers (outside React tree).
 * WHY: Capacitor listeners live in services; React Router navigate must be registered by a hook.
 */

export type PushNavigateHandler = (to: string) => void;

let navigateHandler: PushNavigateHandler | null = null;

export function registerPushNavigateHandler(handler: PushNavigateHandler): void {
  navigateHandler = handler;
}

export function unregisterPushNavigateHandler(handler?: PushNavigateHandler): void {
  if (handler && navigateHandler !== handler) return;
  navigateHandler = null;
}

export function navigateFromPushRoute(to: string): boolean {
  if (!navigateHandler) return false;
  navigateHandler(to);
  return true;
}
