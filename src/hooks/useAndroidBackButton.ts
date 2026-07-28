import { App } from '@capacitor/app';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '../config/nav.config';
import { ROUTES } from '../config/routes';
import { isCapacitorNativePlatform } from '../lib/capacitorPlatform';
import { canNavigateHistoryBack, resolveHudBackFallback } from '../lib/hudBackNavigation';
import { hapticService } from '../services/hapticService';

/** Tab roots + auth gate — first back press opens exit confirm instead of leaving. */
const ROOT_PATHS = new Set<string>([
  ...NAV_ITEMS.map((item) => item.path),
  ROUTES.authChoice,
]);

export interface UseAndroidBackButtonResult {
  exitModalOpen: boolean;
  closeExitModal: () => void;
}

/**
 * Native Android back-button guard (GOAT Meter pattern).
 * WHY: Capacitor WebView exits immediately on back at history root; we intercept at tab roots
 * with a confirm modal and route sub-pages through the same HUD back pop/fallback contract.
 */
export function useAndroidBackButton(): UseAndroidBackButtonResult {
  const navigate = useNavigate();
  const location = useLocation();
  const [exitModalOpen, setExitModalOpen] = useState(false);

  const pathnameRef = useRef(location.pathname);
  const searchRef = useRef(location.search);
  const exitModalOpenRef = useRef(exitModalOpen);

  pathnameRef.current = location.pathname;
  searchRef.current = location.search;
  exitModalOpenRef.current = exitModalOpen;

  const closeExitModal = useCallback(() => {
    setExitModalOpen(false);
  }, []);

  useEffect(() => {
    if (!isCapacitorNativePlatform()) return;

    const handler = () => {
      const pathname = pathnameRef.current;
      const modalOpen = exitModalOpenRef.current;

      if (modalOpen) {
        void App.exitApp();
        return;
      }

      if (ROOT_PATHS.has(pathname)) {
        void hapticService.trigger('warning');
        setExitModalOpen(true);
        return;
      }

      if (canNavigateHistoryBack(window.history.state)) {
        navigate(-1);
        return;
      }
      navigate(resolveHudBackFallback(pathname, searchRef.current), { replace: true });
    };

    const listenerPromise = App.addListener('backButton', handler);
    return () => {
      void listenerPromise.then((listener) => listener.remove());
    };
  }, [navigate]);

  return { exitModalOpen, closeExitModal };
}
