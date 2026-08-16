/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HISTORY_RHYTHM_EXPANDED_KEY,
  useHistoryRhythmExpanded,
} from '../useHistoryRhythmExpanded';

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
  getCurrent: () => ReturnType<typeof useHistoryRhythmExpanded> | null;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: ReturnType<typeof useHistoryRhythmExpanded> | null = null;

  function Harness() {
    latest = useHistoryRhythmExpanded();
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

describe('useHistoryRhythmExpanded', () => {
  it('defaults to collapsed when no preference is stored', () => {
    const harness = renderHarness();
    expect(harness.getCurrent()!.expanded).toBe(false);
    harness.unmount();
  });

  it('treats invalid stored values as collapsed', () => {
    storage.set(HISTORY_RHYTHM_EXPANDED_KEY, '1');
    const harness = renderHarness();
    expect(harness.getCurrent()!.expanded).toBe(false);
    harness.unmount();
  });

  it('restores an expanded preference from local storage', () => {
    storage.set(HISTORY_RHYTHM_EXPANDED_KEY, 'true');
    const harness = renderHarness();
    expect(harness.getCurrent()!.expanded).toBe(true);
    harness.unmount();
  });

  it('persists toggles without writing the footprint blob key', () => {
    const harness = renderHarness();
    act(() => {
      harness.getCurrent()!.toggle();
    });
    expect(harness.getCurrent()!.expanded).toBe(true);
    expect(storage.get(HISTORY_RHYTHM_EXPANDED_KEY)).toBe('true');
    expect(storage.has('up.trainingFootprint')).toBe(false);
    act(() => {
      harness.getCurrent()!.toggle();
    });
    expect(harness.getCurrent()!.expanded).toBe(false);
    expect(storage.get(HISTORY_RHYTHM_EXPANDED_KEY)).toBe('false');
    harness.unmount();
  });
});
