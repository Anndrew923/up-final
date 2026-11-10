import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  registerPushNavigateHandler,
  unregisterPushNavigateHandler,
} from '../services/pushNavigationBridge';
import { pushNotificationService } from '../services/pushNotificationService';

/** Deferred retries after enabled flips true — Capacitor bridge / guild hydrate can lag one tick. */
const GUILD_PUSH_RETRY_MS = [0, 400, 1200] as const;

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
 * Retries briefly after `enabled` becomes true so async Crew hydration cannot skip register().
 *
 * Design notes:
 * - No sticky module/session ref across effect cleanups — React StrictMode remount must re-arm.
 * - Stop scheduling further attempts after the first successful `register()` invocation.
 * - Concurrent calls are coalesced inside `registerPushForGuildDispatches` (`registerInFlight`).
 */
export function useGuildPushRegistration(options: {
  enabled: boolean;
}): void {
  const enabled = options.enabled;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let succeeded = false;
    const timers: number[] = [];

    const clearTimers = () => {
      for (const id of timers) window.clearTimeout(id);
      timers.length = 0;
    };

    const attempt = (reason: string) => {
      if (cancelled || succeeded) return;
      console.info('[Push] useGuildPushRegistration attempt:', reason);
      // Fire-and-forget — never awaited by Crew render / guild fetch.
      void pushNotificationService.registerForGuildDispatches().then((ok) => {
        if (cancelled) return;
        if (!ok) return;
        // WHY: Native register() accepted — cancel deferred retries to avoid triple APNs chatter.
        succeeded = true;
        clearTimers();
      });
    };

    // WHY: Push-wake → /crew must prioritize guild cache paint + getDoc over APNs register().
    // Yield one macrotask before the retry loop so first paint is not contended.
    timers.push(
      window.setTimeout(() => {
        if (cancelled || succeeded) return;
        for (const delayMs of GUILD_PUSH_RETRY_MS) {
          if (delayMs === 0) {
            attempt('immediate');
            continue;
          }
          timers.push(
            window.setTimeout(() => {
              attempt(`retry@${delayMs}ms`);
            }, delayMs)
          );
        }
      }, 0)
    );

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [enabled]);
}
