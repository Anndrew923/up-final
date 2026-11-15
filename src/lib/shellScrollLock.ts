/** Single scroll outlet in AppShell — overlays lock this instead of mutating `body`. */
export const SHELL_SCROLL_ID = 'layer-shell-scroll';

/**
 * Shared GPU compositor fence for Home scroll / radar board / chart.
 * WHY single token: AppShell + HomeRadarBoard + HexRadarChart must not drift to different
 * isolation strategies while fencing WKWebView tile-[0,0] invalidation.
 */
export const WEBKIT_COMPOSITOR_FENCE_CLASS = 'isolation-isolate transform-gpu';

/**
 * Force WKWebView to repaint scroll tiles after a full-screen splash unmounts.
 * WHY: LaunchQuoteSplash covers tile [0,0]; without a compositor bump, Home radar filters
 * can leave a stale black GPU tile at the top-left until the next full invalidate.
 * Side effect is intentional — attribute toggle (no CSS consumer) forces a layer invalidate.
 */
export function bumpShellScrollCompositorAfterSplash(): void {
  if (typeof document === 'undefined') return;
  const shell = document.getElementById(SHELL_SCROLL_ID);
  if (!shell) return;

  shell.removeAttribute('data-splash-settled');
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      shell.setAttribute('data-splash-settled', 'true');
    });
  });
}

let lockCount = 0;
let savedOverflow = '';

export function acquireShellScrollLock(): void {
  if (typeof document === 'undefined') return;
  const shell = document.getElementById(SHELL_SCROLL_ID);
  if (!shell) return;

  if (lockCount === 0) {
    savedOverflow = shell.style.overflow;
    shell.style.overflow = 'hidden';
  }
  lockCount += 1;
}

export function releaseShellScrollLock(): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount !== 0) return;

  if (typeof document === 'undefined') return;
  const shell = document.getElementById(SHELL_SCROLL_ID);
  if (!shell) return;
  shell.style.overflow = savedOverflow;
  savedOverflow = '';
}

/** @internal test hook */
export function __resetShellScrollLockForTests(): void {
  lockCount = 0;
  savedOverflow = '';
}
