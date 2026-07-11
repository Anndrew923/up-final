import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_PREFIX = 'up.home.section.';

function readStoredExpanded(sectionId: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${sectionId}`);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  } catch {
    /* private mode / quota */
  }
  return null;
}

function writeStoredExpanded(sectionId: string, value: boolean): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${sectionId}`, String(value));
  } catch {
    /* ignore */
  }
}

export interface UseHomeSectionExpandedOptions {
  sectionId: string;
  /** When true, section stays open and user cannot collapse (validation / incomplete baseline). */
  forceExpanded: boolean;
  /** Initial open state when the user has not toggled this session. */
  defaultExpanded: boolean;
}

/**
 * Session-persisted expand/collapse for Home profile cards.
 * WHY: Returning users get a cleaner radar-first layout; incomplete or errored forms stay visible.
 */
export function useHomeSectionExpanded({
  sectionId,
  forceExpanded,
  defaultExpanded,
}: UseHomeSectionExpandedOptions) {
  const [userExpanded, setUserExpanded] = useState<boolean | null>(() =>
    readStoredExpanded(sectionId)
  );
  const wasForceExpandedRef = useRef(forceExpanded);

  useEffect(() => {
    if (forceExpanded) {
      setUserExpanded(true);
      // WHY: Do not persist force-open into sessionStorage. Writing `true` here used to leave
      // physical-profile sticky-open after baseline completed, pushing sync CTA below the fold.
      wasForceExpandedRef.current = true;
      return;
    }
    if (wasForceExpandedRef.current) {
      // Lock lifted → collapse so Home returns to radar-first density.
      setUserExpanded(false);
      writeStoredExpanded(sectionId, false);
      wasForceExpandedRef.current = false;
    }
  }, [forceExpanded, sectionId]);

  const expanded = forceExpanded ? true : (userExpanded ?? defaultExpanded);

  const setExpanded = useCallback(
    (next: boolean) => {
      if (forceExpanded && !next) return;
      setUserExpanded(next);
      writeStoredExpanded(sectionId, next);
    },
    [forceExpanded, sectionId]
  );

  const toggle = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  return { expanded, setExpanded, toggle, canCollapse: !forceExpanded };
}
