/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const registerForGuildDispatches = vi.fn(async () => true);
const attachListeners = vi.fn(async () => undefined);

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../services/pushNotificationService', () => ({
  pushNotificationService: {
    registerForGuildDispatches: () => registerForGuildDispatches(),
    attachListeners: () => attachListeners(),
  },
}));

vi.mock('../../services/pushNavigationBridge', () => ({
  registerPushNavigateHandler: vi.fn(),
  unregisterPushNavigateHandler: vi.fn(),
}));

describe('useGuildPushRegistration', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    registerForGuildDispatches.mockClear();
    registerForGuildDispatches.mockResolvedValue(true);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    vi.useRealTimers();
  });

  it('attempts registration when enabled and stops retries after success', async () => {
    const { useGuildPushRegistration } = await import('../usePushNotificationLifecycle');

    function Probe({ enabled }: { enabled: boolean }) {
      useGuildPushRegistration({ enabled });
      return null;
    }

    await act(async () => {
      root.render(<Probe enabled />);
    });

    expect(registerForGuildDispatches).toHaveBeenCalledTimes(1);

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Successful first attempt cancels 400ms / 1200ms retries.
    expect(registerForGuildDispatches).toHaveBeenCalledTimes(1);
  });

  it('retries when the first attempt fails', async () => {
    registerForGuildDispatches
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const { useGuildPushRegistration } = await import('../usePushNotificationLifecycle');

    function Probe({ enabled }: { enabled: boolean }) {
      useGuildPushRegistration({ enabled });
      return null;
    }

    await act(async () => {
      root.render(<Probe enabled />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(registerForGuildDispatches.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('does not register when disabled', async () => {
    const { useGuildPushRegistration } = await import('../usePushNotificationLifecycle');

    function Probe() {
      useGuildPushRegistration({ enabled: false });
      return null;
    }

    await act(async () => {
      root.render(<Probe />);
    });

    expect(registerForGuildDispatches).not.toHaveBeenCalled();
  });
});
