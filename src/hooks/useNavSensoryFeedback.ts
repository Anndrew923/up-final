import { useEffect, useRef } from 'react';
import { useTabRouteTransitionStore } from '../stores/tabRouteTransitionStore';
import { hapticService } from '../services/hapticService';

/**
 * Fires PDK Ack when the central tab crossfade clock completes (150ms settle phase).
 * Tick is handled on BottomNav press — WHY: 0ms卡榫 must align with finger down, not pathname.
 */
export function useNavSensoryFeedback(): void {
  const phase = useTabRouteTransitionStore((state) => state.phase);
  const generation = useTabRouteTransitionStore((state) => state.generation);
  const lastAckGenerationRef = useRef(0);

  useEffect(() => {
    if (phase !== 'settle') return;
    if (generation === lastAckGenerationRef.current) return;
    lastAckGenerationRef.current = generation;
    void hapticService.triggerNavTabSensory('ack');
  }, [generation, phase]);
}

/** 0ms tick — call from BottomNav when navigating to a different tab route. */
export function triggerNavTabTick(): void {
  void hapticService.triggerNavTabSensory('tick');
}
