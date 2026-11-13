/**
 * Capacitor Push Notifications lifecycle — permission, token upsert, action routing, sign-out clear.
 * WHY: Club Progress Dispatch FCM requires a registered device token; only native shells apply.
 */
import { App } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  PushNotifications,
  type PermissionStatus,
  type Token,
  type ActionPerformed,
} from '@capacitor/push-notifications';
import { isCapacitorNativePlatform } from '../lib/capacitorPlatform';
import { stashClubDispatchPushTap } from '../logic/core/clubDispatchTapCache';
import { buildClubDispatchAndroidChannel } from '../logic/core/pushNotificationChannel';
import {
  resolvePushNotificationRoute,
  resolvePushPlatform,
} from '../logic/core/pushNotificationRoute';
import { parseClubDispatchPushData } from '../logic/core/parseClubDispatchPushData';
import { upsertPushToken } from './guildCallableService';
import { navigateFromPushRoute } from './pushNavigationBridge';

type ListenerKey = 'registration' | 'registrationError' | 'pushNotificationActionPerformed';

const listenerHandles: Partial<Record<ListenerKey, PluginListenerHandle>> = {};
let listenersAttached = false;
let listenersAttachInFlight: Promise<void> | null = null;
let registerInFlight: Promise<boolean> | null = null;
let appStateHandle: PluginListenerHandle | null = null;
let foregroundCleanupAttached = false;
let androidChannelEnsured = false;

async function removeListener(key: ListenerKey): Promise<void> {
  const handle = listenerHandles[key];
  if (!handle) return;
  try {
    await handle.remove();
  } catch (error) {
    console.warn('[Push] listener remove failed', key, error);
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
    console.warn('[Push] registration returned empty token');
    return;
  }
  console.info('[Push] Received token, calling upsertPushToken...');
  const platform = resolvePushPlatform(Capacitor.getPlatform());
  const result = await upsertPushToken({
    fcmToken: value,
    fcmPlatform: platform,
  });
  if (!result.ok) {
    console.warn('[Push] upsertPushToken failed', result.reason);
    return;
  }
  console.info('[Push] Token upserted successfully');
}

function onRegistrationError(error: unknown): void {
  console.error('[Push] Native registration failed:', error);
}

/**
 * Ensure Android 8+ HIGH-importance channel exists before any FCM delivery.
 * Idempotent; no-op on iOS/web. Never throws.
 */
export async function ensureClubDispatchAndroidChannel(): Promise<void> {
  if (!isCapacitorNativePlatform()) return;
  if (Capacitor.getPlatform() !== 'android') return;
  if (androidChannelEnsured) return;
  try {
    const channel = buildClubDispatchAndroidChannel();
    await PushNotifications.createChannel({
      id: channel.id,
      name: channel.name,
      importance: channel.importance,
      vibration: channel.vibration,
    });
    androidChannelEnsured = true;
    console.info('[Push] Android channel ready', channel.id);
  } catch (error) {
    console.warn('[Push] createChannel failed', error);
  }
}

function onActionPerformed(action: ActionPerformed): void {
  const data = action.notification?.data;
  const route = resolvePushNotificationRoute(data);
  if (!route) {
    console.warn('[Push] action missing safe route', data);
    return;
  }
  // WHY: Stash comment before navigate — Crew may hydrate roster after cold-start (0 Firestore reads).
  const parsed = parseClubDispatchPushData(data);
  if (parsed) {
    stashClubDispatchPushTap(parsed);
  }
  const ok = navigateFromPushRoute(route);
  if (!ok) {
    console.warn('[Push] navigate rejected empty route', route);
  }
}

/**
 * Attach Capacitor listeners once. Rolls back partial attaches on failure
 * so a retry never stacks duplicate registration handlers.
 */
async function ensureListeners(): Promise<void> {
  if (listenersAttached) return;
  if (listenersAttachInFlight) {
    await listenersAttachInFlight;
    return;
  }

  listenersAttachInFlight = (async () => {
    try {
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
    } catch (error) {
      await detachListeners();
      throw error;
    } finally {
      listenersAttachInFlight = null;
    }
  })();

  await listenersAttachInFlight;
}

/**
 * Clear Notification Center entries and icon badge (Capacitor iOS also zeros badge natively).
 * Best-effort — never throws.
 */
export async function clearDeliveredNotificationsAndBadge(): Promise<void> {
  if (!isCapacitorNativePlatform()) return;
  try {
    await PushNotifications.removeAllDeliveredNotifications();
  } catch (error) {
    console.warn('[Push] clear delivered notifications failed', error);
  }
}

/**
 * When the app becomes active, clear delivered pushes + badge so the home-screen red dot resets.
 * Idempotent; safe to call from cold-start attach. Never throws.
 */
async function attachPushForegroundCleanup(): Promise<void> {
  if (!isCapacitorNativePlatform() || foregroundCleanupAttached) return;
  foregroundCleanupAttached = true;
  try {
    // Cold start / first attach — user is already looking at the app.
    void clearDeliveredNotificationsAndBadge();
    appStateHandle = await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void clearDeliveredNotificationsAndBadge();
      }
    });
  } catch (error) {
    foregroundCleanupAttached = false;
    console.warn('[Push] attach foreground cleanup failed', error);
  }
}

async function detachForegroundCleanup(): Promise<void> {
  if (appStateHandle) {
    try {
      await appStateHandle.remove();
    } catch (error) {
      console.warn('[Push] appState listener remove failed', error);
    }
    appStateHandle = null;
  }
  foregroundCleanupAttached = false;
}

/**
 * Attach push listeners without requesting permission.
 * WHY: Cold-start notification taps fire before Crew mounts — listeners must be early.
 * Safe no-op on web. Never throws.
 */
export async function attachPushListeners(): Promise<void> {
  if (!isCapacitorNativePlatform()) return;
  try {
    await ensureClubDispatchAndroidChannel();
    await ensureListeners();
    await attachPushForegroundCleanup();
  } catch (error) {
    console.warn('[Push] attach listeners failed', error);
  }
}

/**
 * Request permission (if needed) and register for remote notifications.
 * No-op on web / non-native. Never throws to callers.
 */
export async function registerPushForGuildDispatches(): Promise<boolean> {
  // WHY: Web Crew visits are common in local QA — stay silent to avoid log noise.
  if (!isCapacitorNativePlatform()) return false;
  if (registerInFlight) return registerInFlight;

  registerInFlight = (async () => {
    try {
      console.info('[Push] Starting registration check...');
      await ensureClubDispatchAndroidChannel();
      await ensureListeners();

      let status: PermissionStatus = await PushNotifications.checkPermissions();
      console.info('[Push] Current permission status:', status.receive);

      if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
        console.info('[Push] Requesting permissions...');
        status = await PushNotifications.requestPermissions();
        console.info('[Push] Permission after request:', status.receive);
      }

      // WHY: Already-granted sessions must still call register() to mint/refresh the APNs/FCM token.
      if (status.receive !== 'granted') {
        console.warn('[Push] permission not granted — aborting register()', status.receive);
        return false;
      }

      console.info('[Push] Requesting native PushNotifications.register()...');
      await PushNotifications.register();
      console.info('[Push] PushNotifications.register() invoked');
      return true;
    } catch (error) {
      console.warn('[Push] register failed', error);
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
  // WHY: Finish in-flight register before clear so we don't upsert a token after delete,
  // and don't leave register() running against detached listeners.
  const inFlight = registerInFlight;
  if (inFlight) {
    try {
      await inFlight;
    } catch {
      /* register already swallows — keep clear path resilient */
    }
  }

  try {
    if (isCapacitorNativePlatform()) {
      await upsertPushToken({ clear: true });
    }
  } catch (error) {
    console.warn('[Push] clear token failed', error);
  }
  try {
    await detachListeners();
  } catch (error) {
    console.warn('[Push] detach listeners failed', error);
  }
  // WHY: Keep appState→badge clear across sign-out — it is shell UX, not auth-scoped.
}

/** Test seam — reset module state between unit tests. */
export async function __resetPushNotificationServiceForTests(): Promise<void> {
  registerInFlight = null;
  listenersAttachInFlight = null;
  androidChannelEnsured = false;
  await detachListeners();
  await detachForegroundCleanup();
}

export const pushNotificationService = {
  attachListeners: attachPushListeners,
  registerForGuildDispatches: registerPushForGuildDispatches,
  clearOnSignOut: clearPushOnSignOut,
  clearDeliveredNotificationsAndBadge,
  ensureClubDispatchAndroidChannel,
};
