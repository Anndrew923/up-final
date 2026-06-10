import { useEffect } from 'react';
import { acquireShellScrollLock, releaseShellScrollLock } from '../lib/shellScrollLock';

/**
 * Prevents `#layer-shell-scroll` from scrolling while a modal / overlay is open.
 * WHY: Ref-counted — nested overlays must not restore scroll until all layers close.
 */
export function useShellScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    acquireShellScrollLock();
    return () => releaseShellScrollLock();
  }, [active]);
}
