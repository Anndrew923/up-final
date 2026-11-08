/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkPermissions = vi.fn();
const requestPermissions = vi.fn();
const register = vi.fn();
const addListener = vi.fn<(event: string, cb: (payload: unknown) => void) => Promise<{ remove: () => Promise<void> }>>();
const upsertPushToken = vi.fn();
const isNative = vi.fn(() => true);
const getPlatform = vi.fn(() => 'ios');
const navigateFromPushRoute = vi.fn<(route: string) => boolean>(() => true);

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNative(),
    getPlatform: () => getPlatform(),
  },
}));

vi.mock('../../lib/capacitorPlatform', () => ({
  isCapacitorNativePlatform: () => isNative(),
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    checkPermissions: () => checkPermissions(),
    requestPermissions: () => requestPermissions(),
    register: () => register(),
    addListener: (event: string, cb: (payload: unknown) => void) => addListener(event, cb),
  },
}));

vi.mock('../guildCallableService', () => ({
  upsertPushToken: (payload: unknown) => upsertPushToken(payload),
}));

vi.mock('../pushNavigationBridge', () => ({
  navigateFromPushRoute: (route: string) => navigateFromPushRoute(route),
}));

describe('pushNotificationService', () => {
  beforeEach(async () => {
    vi.resetModules();
    checkPermissions.mockReset();
    requestPermissions.mockReset();
    register.mockReset();
    addListener.mockReset();
    upsertPushToken.mockReset();
    navigateFromPushRoute.mockReset();
    isNative.mockReturnValue(true);
    getPlatform.mockReturnValue('ios');
    navigateFromPushRoute.mockReturnValue(true);
    upsertPushToken.mockResolvedValue({ ok: true, cleared: false, fcmPlatform: 'ios' });

    addListener.mockImplementation(async (_event: string, _cb: unknown) => ({
      remove: vi.fn(async () => undefined),
    }));
  });

  it('requests permission when prompted then registers and upserts token', async () => {
    checkPermissions.mockResolvedValue({ receive: 'prompt' });
    requestPermissions.mockResolvedValue({ receive: 'granted' });
    register.mockResolvedValue(undefined);

    const listeners: Record<string, (payload: unknown) => void> = {};
    addListener.mockImplementation(async (event: string, cb: (payload: unknown) => void) => {
      listeners[event] = cb;
      return { remove: vi.fn(async () => undefined) };
    });

    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();

    const ok = await pushNotificationService.registerForGuildDispatches();
    expect(ok).toBe(true);
    expect(requestPermissions).toHaveBeenCalled();
    expect(register).toHaveBeenCalled();

    await listeners.registration?.({ value: 'token-abc-123456' });
    expect(upsertPushToken).toHaveBeenCalledWith({
      fcmToken: 'token-abc-123456',
      fcmPlatform: 'ios',
    });
  });

  it('navigates on pushNotificationActionPerformed with safe route', async () => {
    checkPermissions.mockResolvedValue({ receive: 'granted' });
    register.mockResolvedValue(undefined);
    const listeners: Record<string, (payload: unknown) => void> = {};
    addListener.mockImplementation(async (event: string, cb: (payload: unknown) => void) => {
      listeners[event] = cb;
      return { remove: vi.fn(async () => undefined) };
    });

    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    await pushNotificationService.registerForGuildDispatches();

    listeners.pushNotificationActionPerformed?.({
      actionId: 'tap',
      notification: { data: { route: '/crew?focusUid=u2' } },
    });
    expect(navigateFromPushRoute).toHaveBeenCalledWith('/crew?focusUid=u2');
  });

  it('clears token and detaches listeners on sign-out', async () => {
    checkPermissions.mockResolvedValue({ receive: 'granted' });
    register.mockResolvedValue(undefined);
    const remove = vi.fn(async () => undefined);
    addListener.mockResolvedValue({ remove });

    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    await pushNotificationService.registerForGuildDispatches();
    upsertPushToken.mockClear();

    await pushNotificationService.clearOnSignOut();
    expect(upsertPushToken).toHaveBeenCalledWith({ clear: true });
    expect(remove).toHaveBeenCalled();
  });

  it('no-ops registration on non-native', async () => {
    isNative.mockReturnValue(false);
    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    const ok = await pushNotificationService.registerForGuildDispatches();
    expect(ok).toBe(false);
    expect(register).not.toHaveBeenCalled();
  });

  it('skips register when permission is denied', async () => {
    checkPermissions.mockResolvedValue({ receive: 'denied' });
    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    const ok = await pushNotificationService.registerForGuildDispatches();
    expect(ok).toBe(false);
    expect(requestPermissions).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });

  it('rolls back partial listeners when attach fails mid-way', async () => {
    const remove = vi.fn(async () => undefined);
    addListener
      .mockResolvedValueOnce({ remove })
      .mockRejectedValueOnce(new Error('attach-failed'));

    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    const ok = await pushNotificationService.registerForGuildDispatches();
    expect(ok).toBe(false);
    expect(remove).toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });

  it('attachListeners wires handlers without permission or register', async () => {
    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    await pushNotificationService.attachListeners();
    expect(addListener).toHaveBeenCalled();
    expect(checkPermissions).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });
});
