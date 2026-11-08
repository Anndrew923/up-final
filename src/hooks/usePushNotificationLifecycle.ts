import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  registerPushNavigateHandler,
  unregisterPushNavigateHandler,
} from '../services/pushNavigationBridge';
import { pushNotificationService } from '../services/pushNotificationService';

/**
 * Registers React Router navigate for push action taps (app-wide) and
 * ensures Capacitor action listeners are attached (re-attach after sign-out).
 * Mount once under Router (e.g. AppShell).
 */
export function usePushNavigateBridge(): void {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (to: string) => {
      navigate(to);
    };
    registerPushNavigateHandler(handler);
    void pushNotificationService.attachListeners();
    return () => {
      unregisterPushNavigateHandler(handler);
    };
  }, [navigate]);
}

/**
 * Non-blocking push registration when the user is signed in and has a club.
 * WHY: Avoid permission prompts for guests / non-members on cold start.
 */
export function useGuildPushRegistration(options: {
  enabled: boolean;
}): void {
  const enabled = options.enabled;

  useEffect(() => {
    if (!enabled) return;
    void pushNotificationService.registerForGuildDispatches();
  }, [enabled]);
}
