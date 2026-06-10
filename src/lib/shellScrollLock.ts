/** Single scroll outlet in AppShell — overlays lock this instead of mutating `body`. */
export const SHELL_SCROLL_ID = 'layer-shell-scroll';

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
