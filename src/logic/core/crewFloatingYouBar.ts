/**
 * Club private ladder — when to show the sticky “You” floating rank bar.
 * WHY: Pure predicate keeps IntersectionObserver / list layout out of presentational components.
 */

/** Mirror global ladder: ranks below this near scroll-top stay sticky for jump affordance. */
export const CREW_FLOATING_FORCE_RANK_THRESHOLD = 8;

/**
 * List height vs viewport — club card sits mid-page, so ~55% of viewport ≈ “needs scroll”.
 * WHY: Named constant avoids magic ratio drift between measure effect and docs.
 */
export const CREW_LIST_OVERFLOW_VIEWPORT_RATIO = 0.55;

/** Shell / window scrollY below this counts as “at top” for force-floating. */
export const CREW_FLOATING_AT_TOP_SCROLL_PX = 24;

export function shouldShowCrewFloatingYouBar(params: {
  /** 1-based rank when auth user is on the ranked roster; null if absent. */
  myRank: number | null;
  /** True when the user’s row intersects the visible viewport (IO). */
  myRowInViewport: boolean;
  /**
   * True when the ranked list taller than the viewport fraction (content overflow).
   * WHY: Gates force-at-top so short rosters never pin a redundant sticky bar.
   */
  listOverflowsViewport: boolean;
  /** Force show near top of page when rank is below the fold (same threshold spirit as global ladder). */
  forceAtTop: boolean;
  /** Detail sheet open — sticky bar must not fight the modal. */
  detailOpen?: boolean;
}): boolean {
  if (params.detailOpen) return false;
  if (params.myRank == null || params.myRank < 1) return false;
  if (!params.myRowInViewport) return true;
  return params.forceAtTop && params.listOverflowsViewport;
}

/** True when any core axis has a usable score for compare-with-me overlay. */
export function scoreMapHasPositiveAxis(
  scores: Partial<Record<string, number>> | null | undefined
): boolean {
  if (!scores) return false;
  return Object.values(scores).some(
    (v) => typeof v === 'number' && Number.isFinite(v) && v > 0
  );
}
