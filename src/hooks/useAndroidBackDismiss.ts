import { useEffect, useRef } from 'react';
import { pushAndroidBackDismiss } from '../lib/androidBackDismissStack';

/**
 * Register an open overlay on the Android hardware-back stack.
 * WHY: Tab roots open exit-confirm on back. A mounted overlay must claim the
 * event first, and unregister on close so a later surface is not shadowed.
 * The handler lives in a ref so parent state (nested sheets) stays current
 * without re-pushing and stealing LIFO order from a newer overlay.
 */
export function useAndroidBackDismiss(active: boolean, onDismiss: () => void): void {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!active) return;
    return pushAndroidBackDismiss(() => {
      onDismissRef.current();
      return true;
    });
  }, [active]);
}
