/**
 * Capacitor Push Notifications lifecycle — permission, token upsert, action routing, sign-out clear.
 * WHY: Club Progress Dispatch FCM requires a registered device token; only native shells apply.
 */
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  PushNotifications,
  type PermissionStatus,
  type Token,
  type PushNotificationSchema,
  type ActionPerformed,
} from '@capacitor/push-notifications';
import { isCapacitorNativePlatform } from '../lib/capacitorPlatform';
import {
  resolvePushNotificationRoute,
  resolvePushPlatform,
} from '../logic/core/pushNotificationRoute';
import { upsertPushToken } from './guildCallableService';
import { navigateFromPushRoute } from './pushNavigationBridge';

type ListenerKey = 'registration' | 'registrationError' | 'pushNotificationActionPerformed';

const listenerHandles: Partial<Record<ListenerKey, PluginListenerHandle>> = {};
let listenersAttached = false;
let registerInFlight: Promise<boolean> | null = null;

async function removeListener(key: ListenerKey): Promise<void> {
  const handle = listenerHandles[key];
  if (!handle) return;
  try {
    await handle.remove();
  } catch (error) {
    console.warn('[push] listener remove failed', key, error);
  }
  delete listenerHandles[key];
}

async function detachListeners(): Promise<void> {
  await Promise.all([
    removeListener('registration'),
    removeListener('registrationError'),
    removeListener('pushNotificationActionPerformed'),
  ]);
  listenersAttached = false;
}

async function onRegistration(token: Token): Promise<void> {
  const value = typeof token?.value === 'string' ? token.value.trim() : '';
  if (!value) {
    console.warn('[push] registration returned empty token');
    return;
  }
  const platform = resolvePushPlatform(Capacitor.getPlatform());
  const result = await upsertPushToken({
    fcmToken: value,
    fcmPlatform: platform,
  });
  if (!result.ok) {
    console.warn('[push] upsertPushToken failed', result.reason);
  }
}

function onRegistrationError(error: unknown): void {
  console.warn('[push] registrationError', error);
}

function onActionPerformed(action: ActionPerformed): void {
  const notification = action?.notification as PushNotificationSchema | undefined;
  const route = resolvePushNotificationRoute(notification?.data);
  if (!route) {
    console.warn('[push] action missing safe route', notification?.data);
    return;
  }
  const ok = navigateFromPushRoute(route);
  if (!ok) {
    console.warn('[push] navigate handler not registered', route);
  }
}

async function ensureListeners(): Promise<void> {
  if (listenersAttached) return;

  listenerHandles.registration = await PushNotifications.addListener(
    'registration',
    (token) => {
      void onRegistration(token);
    }
  );
  listenerHandles.registrationError = await PushNotifications.addListener(
    'registrationError',
    (error) => {
      onRegistrationError(error);
    }
  );
  listenerHandles.pushNotificationActionPerformed = await PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action) => {
      onActionPerformed(action);
    }
  );
  listenersAttached = true;
}

/**
 * Request permission (if needed) and register for remote notifications.
 * No-op on web / non-native. Never throws to callers.
 */
export async function registerPushForGuildDispatches(): Promise<boolean> {
  if (!isCapacitorNativePlatform()) return false;
  if (registerInFlight) return registerInFlight;

  registerInFlight = (async () => {
    try {
      await ensureListeners();

      let status: PermissionStatus = await PushNotifications.checkPermissions();
      if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
        status = await PushNotifications.requestPermissions();
      }
      if (status.receive !== 'granted') {
        console.warn('[push] permission not granted', status.receive);
        return false;
      }

      await PushNotifications.register();
      return true;
    } catch (error) {
      console.warn('[push] register failed', error);
      return false;
    } finally {
      registerInFlight = null;
    }
  })();

  return registerInFlight;
}

/**
 * Clear server token + detach listeners (call on sign-out).
 * Best-effort — never throws.
 */
export async function clearPushOnSignOut(): Promise<void> {
  try {
    if (isCapacitorNativePlatform()) {
      await upsertPushToken({ clear: true });
    }
  } catch (error) {
    console.warn('[push] clear token failed', error);
  }
  try {
    await detachListeners();
  } catch (error) {
    console.warn('[push] detach listeners failed', error);
  }
}

/** Test seam — reset module state between unit tests. */
export async function __resetPushNotificationServiceForTests(): Promise<void> {
  registerInFlight = null;
  await detachListeners();
}

export const pushNotificationService = {
  registerForGuildDispatches: registerPushForGuildDispatches,
  clearOnSignOut: clearPushOnSignOut,
};
