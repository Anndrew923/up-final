import { useCallback } from 'react';

function safeVibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}

export function useDopamineFeedback() {
  const triggerImpact = useCallback((strength: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (strength === 'light') {
      safeVibrate(12);
      return;
    }
    if (strength === 'heavy') {
      safeVibrate([26, 30, 44]);
      return;
    }
    safeVibrate(20);
  }, []);

  const triggerRankUpCombo = useCallback(() => {
    safeVibrate([24, 42, 54]);
  }, []);

  return {
    triggerImpact,
    triggerRankUpCombo,
  };
}

