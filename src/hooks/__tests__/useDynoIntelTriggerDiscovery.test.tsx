/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useDynoIntelTriggerDiscovery,
  type UseDynoIntelTriggerDiscoveryResult,
} from '../useDynoIntelTriggerDiscovery';
import * as localStorageService from '../../services/localStorageService';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderDiscoveryHook(): {
  getCurrent: () => UseDynoIntelTriggerDiscoveryResult | null;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: UseDynoIntelTriggerDiscoveryResult | null = null;

  function Harness() {
    latest = useDynoIntelTriggerDiscovery();
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    getCurrent: () => latest,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useDynoIntelTriggerDiscovery', () => {
  beforeEach(() => {
    vi.spyOn(localStorageService, 'resolveDynoIntelTriggerDiscovered').mockReturnValue(false);
    vi.spyOn(localStorageService, 'loadDynoIntelTriggerDiscovered').mockReturnValue(false);
    vi.spyOn(localStorageService, 'saveDynoIntelTriggerDiscovered').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts undiscovered when resolve returns false', () => {
    const harness = renderDiscoveryHook();
    expect(harness.getCurrent()?.discovered).toBe(false);
    expect(localStorageService.saveDynoIntelTriggerDiscovered).not.toHaveBeenCalled();
    harness.unmount();
  });

  it('starts discovered when resolve returns true and persists if key missing', () => {
    vi.mocked(localStorageService.resolveDynoIntelTriggerDiscovered).mockReturnValue(true);
    const harness = renderDiscoveryHook();
    expect(harness.getCurrent()?.discovered).toBe(true);
    expect(localStorageService.saveDynoIntelTriggerDiscovered).toHaveBeenCalledWith(true);
    harness.unmount();
  });

  it('markDiscovered updates state idempotently and persists once via effect', async () => {
    const harness = renderDiscoveryHook();
    act(() => {
      harness.getCurrent()?.markDiscovered();
      harness.getCurrent()?.markDiscovered();
    });
    expect(harness.getCurrent()?.discovered).toBe(true);
    await act(async () => {
      await Promise.resolve();
    });
    expect(localStorageService.saveDynoIntelTriggerDiscovered).toHaveBeenCalledTimes(1);
    harness.unmount();
  });
});
