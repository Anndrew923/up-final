import { useCallback, useState } from 'react';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

/** UI preference only — never write this onto `up.trainingFootprint`. */
export const HISTORY_RHYTHM_EXPANDED_KEY = 'up.historyRhythmExpanded';

function readStoredExpanded(): boolean {
  return safeGetItem(HISTORY_RHYTHM_EXPANDED_KEY) === 'true';
}

/**
 * Remembers whether 測功節奏 is expanded. Missing/invalid storage → collapsed (first-screen density).
 */
export function useHistoryRhythmExpanded(): {
  expanded: boolean;
  toggle: () => void;
} {
  const [expanded, setExpanded] = useState(() => readStoredExpanded());

  const toggle = useCallback(() => {
    setExpanded((current) => {
      const next = !current;
      safeSetItem(HISTORY_RHYTHM_EXPANDED_KEY, String(next));
      return next;
    });
  }, []);

  return { expanded, toggle };
}
