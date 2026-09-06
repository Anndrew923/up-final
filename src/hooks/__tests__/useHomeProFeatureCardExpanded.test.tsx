/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HOME_PRO_FEATURE_CARD_COLLAPSED_KEY,
  useHomeProFeatureCardExpanded,
} from '../useHomeProFeatureCardExpanded';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: (key: string) => storage.get(key) ?? null,
  safeSetItem: (key: string, value: string) => {
    storage.set(key, value);
    return true;
  },
}));

function renderHarness(): {
  getCurrent: () => ReturnType<typeof useHomeProFeatureCardExpanded> | null;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: ReturnType<typeof useHomeProFeatureCardExpanded> | null = null;

  function Harness() {
    latest = useHomeProFeatureCardExpanded();
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

afterEach(() => {
  storage.clear();
  document.body.innerHTML = '';
});

describe('useHomeProFeatureCardExpanded', () => {
  it('defaults to collapsed when no preference is stored', () => {
    const harness = renderHarness();
    expect(harness.getCurrent()!.isExpanded).toBe(false);
    harness.unmount();
  });

  it('treats collapsed=true as isExpanded false', () => {
    storage.set(HOME_PRO_FEATURE_CARD_COLLAPSED_KEY, 'true');
    const harness = renderHarness();
    expect(harness.getCurrent()!.isExpanded).toBe(false);
    harness.unmount();
  });

  it('restores expanded when collapsed preference is false', () => {
    storage.set(HOME_PRO_FEATURE_CARD_COLLAPSED_KEY, 'false');
    const harness = renderHarness();
    expect(harness.getCurrent()!.isExpanded).toBe(true);
    harness.unmount();
  });

  it('persists toggles with inverted collapsed polarity', () => {
    const harness = renderHarness();
    act(() => {
      harness.getCurrent()!.toggle();
    });
    expect(harness.getCurrent()!.isExpanded).toBe(true);
    expect(storage.get(HOME_PRO_FEATURE_CARD_COLLAPSED_KEY)).toBe('false');
    act(() => {
      harness.getCurrent()!.toggle();
    });
    expect(harness.getCurrent()!.isExpanded).toBe(false);
    expect(storage.get(HOME_PRO_FEATURE_CARD_COLLAPSED_KEY)).toBe('true');
    harness.unmount();
  });
});
