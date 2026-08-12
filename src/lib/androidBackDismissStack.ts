/**
 * LIFO dismiss chain for Android hardware back.
 * WHY: Capacitor back at tab roots opens exit-confirm; overlays (e.g. Dyno Intel sheet)
 * must intercept first without promoting every sheet into a global store.
 */

export type AndroidBackDismissHandler = () => boolean;

const stack: AndroidBackDismissHandler[] = [];

/** Register a dismiss handler; returns unsubscribe (safe if already removed). */
export function pushAndroidBackDismiss(handler: AndroidBackDismissHandler): () => void {
  stack.push(handler);
  return () => {
    const index = stack.lastIndexOf(handler);
    if (index >= 0) stack.splice(index, 1);
  };
}

/**
 * Invoke the topmost handler that returns true (handled).
 * WHY: Nested overlays can stack; walk from top so the latest surface wins.
 */
export function tryDismissTopAndroidBackOverlay(): boolean {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    if (stack[i]?.()) return true;
  }
  return false;
}

/** Test helper — clears residual handlers between cases. */
export function clearAndroidBackDismissStack(): void {
  stack.length = 0;
}
