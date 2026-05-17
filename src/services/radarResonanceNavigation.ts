import type { NavigateFunction } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { markPendingRadarResonance } from './radarResonanceSession';

/** Marks one-shot Home resonance and navigates to the main console. */
export function navigateHomeWithResonance(navigate: NavigateFunction): void {
  markPendingRadarResonance();
  navigate(ROUTES.home);
}
