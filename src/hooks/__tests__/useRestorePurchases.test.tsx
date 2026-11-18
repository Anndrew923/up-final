/* @vitest-environment jsdom */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRestorePurchases } from '../useRestorePurchases';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const restorePurchasesFromDevice = vi.fn();
const authState = { status: 'signed-in' as 'loading' | 'signed-out' | 'signed-in' };

vi.mock('../../services/subscriptionService', () => ({
  restorePurchasesFromDevice: (...args: unknown[]) => restorePurchasesFromDevice(...args),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

function Probe({
  enabled,
  onReady,
}: {
  enabled?: boolean;
  onReady: (api: ReturnType<typeof useRestorePurchases>) => void;
}): ReactElement | null {
  const api = useRestorePurchases({ enabled });
  onReady(api);
  return null;
}

function mountProbe(enabled?: boolean): {
  getApi: () => ReturnType<typeof useRestorePurchases>;
  unmount: () => void;
} {
  let api: ReturnType<typeof useRestorePurchases> | null = null;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <Probe
        enabled={enabled}
        onReady={(value) => {
          api = value;
        }}
      />
    );
  });
  return {
    getApi: () => {
      if (!api) throw new Error('probe not ready');
      return api;
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useRestorePurchases', () => {
  beforeEach(() => {
    authState.status = 'signed-in';
    restorePurchasesFromDevice.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('maps successful restore to restore-ok and clears busy', async () => {
    restorePurchasesFromDevice.mockResolvedValue({ outcome: 'restored', proActive: true });
    const { getApi, unmount } = mountProbe();

    await act(async () => {
      await getApi().restorePurchases();
    });

    expect(restorePurchasesFromDevice).toHaveBeenCalledTimes(1);
    expect(getApi().busy).toBe(false);
    expect(getApi().status).toBe('restore-ok');
    unmount();
  });

  it('blocks duplicate restore while in flight (including same-tick double tap)', async () => {
    let resolveRestore: ((value: { outcome: 'restored'; proActive: boolean }) => void) | null =
      null;
    restorePurchasesFromDevice.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRestore = resolve;
        })
    );
    const { getApi, unmount } = mountProbe();

    let first: Promise<void> | undefined;
    let second: Promise<void> | undefined;
    act(() => {
      // WHY: Same-tick double fire must be stopped by inFlightRef, not only React busy state.
      first = getApi().restorePurchases();
      second = getApi().restorePurchases();
    });
    expect(getApi().busy).toBe(true);
    expect(getApi().canRestore).toBe(false);

    await act(async () => {
      await getApi().restorePurchases();
    });
    expect(restorePurchasesFromDevice).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRestore?.({ outcome: 'restored', proActive: true });
      await Promise.all([first, second]);
    });

    expect(getApi().busy).toBe(false);
    expect(getApi().status).toBe('restore-ok');
    unmount();
  });

  it('does not call store when disabled by host surface', async () => {
    const { getApi, unmount } = mountProbe(false);
    expect(getApi().canRestore).toBe(false);

    await act(async () => {
      await getApi().restorePurchases();
    });

    expect(restorePurchasesFromDevice).not.toHaveBeenCalled();
    unmount();
  });

  it('maps thrown errors to restore-fail', async () => {
    restorePurchasesFromDevice.mockRejectedValue(new Error('store down'));
    const { getApi, unmount } = mountProbe();

    await act(async () => {
      await getApi().restorePurchases();
    });

    expect(getApi().status).toBe('restore-fail');
    expect(getApi().busy).toBe(false);
    unmount();
  });
});
