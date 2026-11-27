import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
} from 'react';

/**
 * Mobile peek-rail smart auto-advance.
 * WHY: Passive visitors discover the next athlete without swiping; pause forever
 * after touch/pointer/hover so CTA taps are never stolen mid-scroll.
 *
 * Gates: itemCount > 1, max-width < md (767px), !prefers-reduced-motion,
 * IntersectionObserver ≥ threshold, !userPaused.
 *
 * Scheduling: chained setTimeout (4500ms). After an advance, the next arm waits
 * for scroll settle (`scrollend` or short debounce) so smooth scroll never fights
 * the interval. `scheduleNextRef` avoids stale self-call closures.
 */

const MD_MAX_MOBILE_MQ = '(max-width: 767px)';
const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)';
const DEFAULT_INTERVAL_MS = 4500;
const DEFAULT_VISIBLE_THRESHOLD = 0.4;
/** Debounce when `scrollend` is unavailable — longer than typical smooth snap. */
const SCROLL_SETTLE_MS = 180;
/** If smooth scroll emits no scroll events, still re-arm after this. */
const SCROLL_FALLBACK_ARM_MS = 600;

export interface UsePeekAutoplayOptions {
  itemCount: number;
  intervalMs?: number;
  visibleThreshold?: number;
}

export interface UsePeekAutoplayResult {
  containerRef: RefObject<HTMLDivElement | null>;
  /** Permanent pause — clears timers and never reschedules. */
  pauseAutoplay: () => void;
}

function readPaddingLeft(el: HTMLElement): number {
  const raw = getComputedStyle(el).paddingLeft;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * ScrollLeft that aligns `child` flush with the container's content inset.
 * WHY: getBoundingClientRect avoids wrong offsetParent when the rail is not
 * the child's offsetParent (e.g. transforms / absolute ancestors).
 */
function scrollLeftForChild(container: HTMLElement, child: HTMLElement): number {
  const pad = readPaddingLeft(container);
  const cRect = container.getBoundingClientRect();
  const iRect = child.getBoundingClientRect();
  return iRect.left - cRect.left + container.scrollLeft - pad;
}

function nearestChildIndex(container: HTMLElement): number {
  const children = Array.from(container.children) as HTMLElement[];
  if (children.length === 0) return 0;

  let bestIndex = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  const current = container.scrollLeft;

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index]!;
    const dist = Math.abs(scrollLeftForChild(container, child) - current);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = index;
    }
  }

  return bestIndex;
}

export function usePeekAutoplay({
  itemCount,
  intervalMs = DEFAULT_INTERVAL_MS,
  visibleThreshold = DEFAULT_VISIBLE_THRESHOLD,
}: UsePeekAutoplayOptions): UsePeekAutoplayResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeIndexRef = useRef(0);
  const userPausedRef = useRef(false);
  const inViewRef = useRef(false);
  const isMobileRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackArmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const scrollRafRef = useRef<number | null>(null);
  const itemCountRef = useRef(itemCount);
  const intervalMsRef = useRef(intervalMs);
  const armTimerRef = useRef<() => void>(() => {});

  itemCountRef.current = itemCount;
  intervalMsRef.current = intervalMs;

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current != null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current != null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const clearFallbackArmTimer = useCallback(() => {
    if (fallbackArmTimerRef.current != null) {
      clearTimeout(fallbackArmTimerRef.current);
      fallbackArmTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearAdvanceTimer();
    clearSettleTimer();
    clearFallbackArmTimer();
  }, [clearAdvanceTimer, clearSettleTimer, clearFallbackArmTimer]);

  const canAutoplay = useCallback(() => {
    return (
      !userPausedRef.current &&
      inViewRef.current &&
      isMobileRef.current &&
      !reducedMotionRef.current &&
      itemCountRef.current > 1
    );
  }, []);

  const syncActiveIndex = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    activeIndexRef.current = nearestChildIndex(container);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const child = container.children[index] as HTMLElement | undefined;
    if (!child) return;
    container.scrollTo({
      left: scrollLeftForChild(container, child),
      behavior: 'smooth',
    });
    activeIndexRef.current = index;
  }, []);

  const armTimer = useCallback(() => {
    clearAdvanceTimer();
    if (!canAutoplay()) return;

    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      if (!canAutoplay()) return;

      const count = itemCountRef.current;
      if (count <= 1) return;

      syncActiveIndex();
      const next = (activeIndexRef.current + 1) % count;
      scrollToIndex(next);

      // WHY: Prefer scrollend/debounce to re-arm after settle; this fallback
      // covers engines that emit neither during programmatic smooth scroll.
      clearFallbackArmTimer();
      fallbackArmTimerRef.current = setTimeout(() => {
        fallbackArmTimerRef.current = null;
        if (canAutoplay() && advanceTimerRef.current == null) {
          armTimerRef.current();
        }
      }, SCROLL_FALLBACK_ARM_MS);
    }, intervalMsRef.current);
  }, [
    canAutoplay,
    clearAdvanceTimer,
    clearFallbackArmTimer,
    scrollToIndex,
    syncActiveIndex,
  ]);

  armTimerRef.current = armTimer;

  const onScrollSettled = useCallback(() => {
    clearSettleTimer();
    clearFallbackArmTimer();
    syncActiveIndex();
    if (canAutoplay()) armTimerRef.current();
  }, [canAutoplay, clearFallbackArmTimer, clearSettleTimer, syncActiveIndex]);

  const pauseAutoplay = useCallback(() => {
    userPausedRef.current = true;
    clearAllTimers();
  }, [clearAllTimers]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const mobileMq = window.matchMedia(MD_MAX_MOBILE_MQ);
    const motionMq = window.matchMedia(REDUCED_MOTION_MQ);

    const syncMedia = () => {
      isMobileRef.current = mobileMq.matches;
      reducedMotionRef.current = motionMq.matches;
      if (!canAutoplay()) {
        clearAllTimers();
        return;
      }
      armTimerRef.current();
    };

    syncMedia();
    mobileMq.addEventListener('change', syncMedia);
    motionMq.addEventListener('change', syncMedia);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          inViewRef.current = Boolean(
            entry &&
              entry.isIntersecting &&
              entry.intersectionRatio >= visibleThreshold,
          );
          if (!canAutoplay()) {
            clearAllTimers();
            return;
          }
          armTimerRef.current();
        },
        { threshold: visibleThreshold },
      );
      observer.observe(container);
    } else {
      inViewRef.current = true;
      if (canAutoplay()) armTimerRef.current();
    }

    const onScroll = () => {
      if (scrollRafRef.current == null) {
        scrollRafRef.current = window.requestAnimationFrame(() => {
          scrollRafRef.current = null;
          syncActiveIndex();
        });
      }
      // Debounced settle — used when `scrollend` is missing or late.
      clearSettleTimer();
      settleTimerRef.current = setTimeout(() => {
        settleTimerRef.current = null;
        onScrollSettled();
      }, SCROLL_SETTLE_MS);
    };

    const onScrollEnd = () => {
      onScrollSettled();
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    container.addEventListener('scrollend', onScrollEnd as EventListener);

    return () => {
      clearAllTimers();
      mobileMq.removeEventListener('change', syncMedia);
      motionMq.removeEventListener('change', syncMedia);
      observer?.disconnect();
      container.removeEventListener('scroll', onScroll);
      container.removeEventListener('scrollend', onScrollEnd as EventListener);
      if (scrollRafRef.current != null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [
    canAutoplay,
    clearAllTimers,
    clearSettleTimer,
    onScrollSettled,
    syncActiveIndex,
    visibleThreshold,
  ]);

  useEffect(() => {
    if (itemCount <= 1) {
      clearAllTimers();
      activeIndexRef.current = 0;
      return;
    }
    if (canAutoplay()) armTimerRef.current();
  }, [itemCount, canAutoplay, clearAllTimers]);

  return { containerRef, pauseAutoplay };
}
