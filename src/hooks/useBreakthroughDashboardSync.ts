import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { navigateHomeWithResonance } from '../services/radarResonanceNavigation';

/**
 * Arm-size breakthrough sync: persist locally, then home resonance — only when save succeeds.
 * Other assessment pages pass `submitToRadar` directly (success navigates away; failure keeps modal open).
 */
export function useArmSizeBreakthroughDashboardSync(
  saveForLeaderboard: () => boolean,
  navigate: NavigateFunction
): () => void {
  return useCallback(() => {
    if (!saveForLeaderboard()) return;
    navigateHomeWithResonance(navigate);
  }, [navigate, saveForLeaderboard]);
}
