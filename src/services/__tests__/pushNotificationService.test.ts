/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkPermissions = vi.fn();
const requestPermissions = vi.fn();
const register = vi.fn();
const createChannel = vi.fn();
const removeAllDeliveredNotifications = vi.fn();
const addListener = vi.fn<(event: string, cb: (payload: unknown) => void) => Promise<{ remove: () => Promise<void> }>>();
const appAddListener = vi.fn();
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

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (event: string, cb: (payload: unknown) => void) => appAddListener(event, cb),
  },
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    checkPermissions: () => checkPermissions(),
    requestPermissions: () => requestPermissions(),
    register: () => register(),
    createChannel: (channel: unknown) => createChannel(channel),
    removeAllDeliveredNotifications: () => removeAllDeliveredNotifications(),
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
    createChannel.mockReset();
    removeAllDeliveredNotifications.mockReset();
    addListener.mockReset();
    appAddListener.mockReset();
    upsertPushToken.mockReset();
    navigateFromPushRoute.mockReset();
    isNative.mockReturnValue(true);
    getPlatform.mockReturnValue('ios');
    navigateFromPushRoute.mockReturnValue(true);
    upsertPushToken.mockResolvedValue({ ok: true, cleared: false, fcmPlatform: 'ios' });
    removeAllDeliveredNotifications.mockResolvedValue(undefined);
    createChannel.mockResolvedValue(undefined);

    addListener.mockImplementation(async (_event: string, _cb: unknown) => ({
      remove: vi.fn(async () => undefined),
    }));
    appAddListener.mockImplementation(async (_event: string, _cb: unknown) => ({
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

  it('stashes dispatch comment from FCM data before navigating (0 Firestore reads)', async () => {
    checkPermissions.mockResolvedValue({ receive: 'granted' });
    register.mockResolvedValue(undefined);
    const listeners: Record<string, (payload: unknown) => void> = {};
    addListener.mockImplementation(async (event: string, cb: (payload: unknown) => void) => {
      listeners[event] = cb;
      return { remove: vi.fn(async () => undefined) };
    });

    const { __resetClubDispatchTapCacheForTests, peekClubDispatchTapCache } = await import(
      '../../logic/core/clubDispatchTapCache'
    );
    __resetClubDispatchTapCacheForTests();

    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    await pushNotificationService.registerForGuildDispatches();

    listeners.pushNotificationActionPerformed?.({
      actionId: 'tap',
      notification: {
        data: {
          type: 'club_progress_dispatch',
          route: '/crew?focusUid=u2',
          guildId: 'g1',
          focusUid: 'u2',
          dispatchId: 'd1',
          comment: '肌肌長大了',
          metricType: 'muscleMass',
          axisScore: '73.74',
          overallScore: '79.26',
          overallDelta: '0.49',
        },
      },
    });

    expect(peekClubDispatchTapCache()?.comment).toBe('肌肌長大了');
    expect(peekClubDispatchTapCache()?.focusUid).toBe('u2');
    expect(navigateFromPushRoute).toHaveBeenCalledWith('/crew?focusUid=u2');
    expect(navigateFromPushRoute.mock.calls[0]?.[0]).not.toContain('肌肌');
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
    expect(createChannel).not.toHaveBeenCalled();
    expect(removeAllDeliveredNotifications).toHaveBeenCalled();
    expect(appAddListener).toHaveBeenCalledWith('appStateChange', expect.any(Function));
  });

  it('creates HIGH club_dispatches channel on Android attach', async () => {
    getPlatform.mockReturnValue('android');
    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    await pushNotificationService.attachListeners();
    expect(createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'club_dispatches',
        importance: 5,
        vibration: true,
      })
    );
    const channelArg = createChannel.mock.calls[0]?.[0] as { name?: string };
    expect(typeof channelArg?.name).toBe('string');
    expect(channelArg.name?.length).toBeGreaterThan(0);
  });

  it('retries createChannel after a failed ensure (androidChannelEnsured stays false)', async () => {
    getPlatform.mockReturnValue('android');
    createChannel.mockRejectedValueOnce(new Error('channel-failed'));
    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    await pushNotificationService.attachListeners();
    expect(createChannel).toHaveBeenCalledTimes(1);

    createChannel.mockClear();
    createChannel.mockResolvedValue(undefined);
    await pushNotificationService.ensureClubDispatchAndroidChannel();
    expect(createChannel).toHaveBeenCalledTimes(1);
  });

  it('clears delivered notifications when app becomes active', async () => {
    const appStateHandlers: Array<(state: { isActive: boolean }) => void> = [];
    appAddListener.mockImplementation(async (_event: string, cb: (payload: unknown) => void) => {
      appStateHandlers.push(cb as (state: { isActive: boolean }) => void);
      return { remove: vi.fn(async () => undefined) };
    });

    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    await pushNotificationService.attachListeners();
    removeAllDeliveredNotifications.mockClear();

    expect(appStateHandlers.length).toBeGreaterThan(0);
    appStateHandlers[0]({ isActive: true });
    expect(removeAllDeliveredNotifications).toHaveBeenCalledTimes(1);

    removeAllDeliveredNotifications.mockClear();
    appStateHandlers[0]({ isActive: false });
    expect(removeAllDeliveredNotifications).not.toHaveBeenCalled();
  });

  it('calls register when permission is already granted without re-prompting', async () => {
    checkPermissions.mockResolvedValue({ receive: 'granted' });
    register.mockResolvedValue(undefined);

    const { pushNotificationService, __resetPushNotificationServiceForTests } = await import(
      '../pushNotificationService'
    );
    await __resetPushNotificationServiceForTests();
    const ok = await pushNotificationService.registerForGuildDispatches();
    expect(ok).toBe(true);
    expect(requestPermissions).not.toHaveBeenCalled();
    expect(register).toHaveBeenCalledTimes(1);
  });
});
