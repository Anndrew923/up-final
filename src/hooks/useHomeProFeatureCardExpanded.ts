import { useCallback, useState } from 'react';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

/**
 * Persists collapsed preference for the Home Pro value capsule.
 * WHY: Key stores *collapsed* (not expanded) so missing/invalid → collapsed default,
 * keeping radar → body-data reading continuous on first visit.
 */
export const HOME_PRO_FEATURE_CARD_COLLAPSED_KEY = 'up_home_pro_card_collapsed';

function readStoredExpanded(): boolean {
  const raw = safeGetItem(HOME_PRO_FEATURE_CARD_COLLAPSED_KEY);
  // Missing / anything other than explicit "false" → collapsed (isExpanded: false).
  if (raw === 'false') return true;
  return false;
}

function writeCollapsedPreference(isExpanded: boolean): void {
  // Polarity: store collapsed flag — expanded=true ⇒ collapsed='false'.
  safeSetItem(HOME_PRO_FEATURE_CARD_COLLAPSED_KEY, isExpanded ? 'false' : 'true');
}

/**
 * Remembers whether the non-Pro Home Pro feature capsule is expanded.
 * Default / missing storage → collapsed (first-screen density).
 */
export function useHomeProFeatureCardExpanded(): {
  isExpanded: boolean;
  toggle: () => void;
} {
  const [isExpanded, setIsExpanded] = useState(() => readStoredExpanded());

  const toggle = useCallback(() => {
    setIsExpanded((current) => {
      const next = !current;
      writeCollapsedPreference(next);
      return next;
    });
  }, []);

  return { isExpanded, toggle };
}
