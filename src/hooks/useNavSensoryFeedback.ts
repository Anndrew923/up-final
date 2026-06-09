import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../config/nav.config';
import { hapticService } from '../services/hapticService';
import { soundService } from '../services/soundService';

const NAV_PATHS = new Set(NAV_ITEMS.map((item) => item.path));

function firePdkShift(): void {
  soundService.play('pdk_shift');
  void hapticService.trigger('ack');
}

/**
 * Fires PDK shift feedback when the user switches bottom-tab routes.
 * WHY: Keeps BottomNav presentational — sensory I/O lives in a dedicated hook.
 */
export function useNavSensoryFeedback(): void {
  const { pathname } = useLocation();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!NAV_PATHS.has(pathname)) {
      previousPathRef.current = pathname;
      return;
    }

    if (previousPathRef.current !== null && previousPathRef.current !== pathname) {
      firePdkShift();
    }
    previousPathRef.current = pathname;
  }, [pathname]);
}
