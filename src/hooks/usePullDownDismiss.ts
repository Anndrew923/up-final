import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/** Finger travel before a pull-down on the handle commits a dismiss. */
export const PULL_DOWN_DISMISS_PX = 96;

export function resolvePullDownRelease(
  offsetPx: number,
  thresholdPx: number = PULL_DOWN_DISMISS_PX
): 'dismiss' | 'snap' {
  return offsetPx >= thresholdPx ? 'dismiss' : 'snap';
}

export interface PullDownHandleProps {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

export interface UsePullDownDismissResult {
  offset: number;
  dragging: boolean;
  handleProps: PullDownHandleProps;
}

/**
 * Pull-down-to-dismiss for a sheet handle only.
 * WHY: Bind to the handle, not the scroll pane, so radar/list vertical scroll
 * never starts a dismiss. Threshold snap-back avoids accidental closes.
 */
export function usePullDownDismiss(enabled: boolean, onDismiss: () => void): UsePullDownDismissResult {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const offsetRef = useRef(0);
  const originYRef = useRef(0);
  const draggingRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    draggingRef.current = false;
    offsetRef.current = 0;
    setDragging(false);
    setOffset(0);
  }, []);

  useEffect(() => {
    if (enabled) return;
    if (!draggingRef.current && offsetRef.current === 0) return;
    reset();
  }, [enabled, reset]);

  const finish = useCallback(() => {
    if (!draggingRef.current) return;
    const decision = resolvePullDownRelease(offsetRef.current);
    draggingRef.current = false;
    setDragging(false);
    if (decision === 'dismiss') {
      // WHY: Leave the translated offset until unmount. Zeroing it first paints a snap-back.
      onDismissRef.current();
      return;
    }
    offsetRef.current = 0;
    setOffset(0);
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    draggingRef.current = true;
    originYRef.current = event.clientY;
    offsetRef.current = 0;
    setDragging(true);
    setOffset(0);
    // WHY: Capture keeps the gesture if the finger slides off the 4px pill onto the card.
    const target = event.currentTarget;
    if (typeof target.setPointerCapture === 'function') {
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // jsdom and some WebViews omit capture; moves still arrive while the pointer is down.
      }
    }
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const next = Math.max(0, event.clientY - originYRef.current);
    offsetRef.current = next;
    setOffset(next);
  }, []);

  return {
    offset,
    dragging,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
    },
  };
}
