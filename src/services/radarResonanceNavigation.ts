import type { NavigateFunction } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { hapticService } from './hapticService';
import { markPendingRadarResonance } from './radarResonanceSession';

/**
 * Marks a one-shot console arrival pulse, then routes home.
 * WHY: Dyno sync must not auto-open the blocking diagnostics overlay; haptic fires first
 * so the tap lands before the route unmounts the assessment view.
 */
export function navigateHomeWithResonance(navigate: NavigateFunction): void {
  markPendingRadarResonance();
  void hapticService.trigger('milestone');
  navigate(ROUTES.home);
}
