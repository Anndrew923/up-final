/* @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHistorySpecBadgeNotification } from '../useHistorySpecBadgeNotification';
import {
  loadSeenBadgeIds,
  markBadgesAsSeen,
  SPEC_BADGE_SEEN_STORAGE_KEY,
} from '../../services/specBadgeSeenService';

const storage = vi.hoisted(() => new Map<string, string>());

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: (key: string) => storage.get(key) ?? null,
  safeSetItem: (key: string, value: string) => {
    storage.set(key, value);
    return true;
  },
  safeRemoveItem: (key: string) => storage.delete(key),
}));

vi.mock('../../services/trainingFootprintService', () => ({
  loadTrainingFootprint: () => ({
    schemaVersion: 1,
    days: {},
    lifetimeDays: 0,
    unlockedBadgeIds: ['IGN-01'],
  }),
  subscribeTrainingFootprint: () => () => undefined,
}));

function renderHarness(): {
  getCurrent: () => { hasUnseenSpecBadge: boolean };
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  let latest: { hasUnseenSpecBadge: boolean } | null = null;
  function Harness() {
    latest = useHistorySpecBadgeNotification();
    return null;
  }

  act(() => {
    root.render(createElement(Harness));
  });

  return {
    getCurrent: () => latest as { hasUnseenSpecBadge: boolean },
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

describe('useHistorySpecBadgeNotification', () => {
  it('grandfathers after mount, not during render, so returning users stay quiet', async () => {
    expect(loadSeenBadgeIds()).toBeNull();

    const harness = renderHarness();

    expect(loadSeenBadgeIds()).toEqual(['IGN-01']);
    expect(harness.getCurrent().hasUnseenSpecBadge).toBe(false);

    harness.unmount();
  });

  it('turns off unread dot after markBadgesAsSeen dispatch', async () => {
    storage.set(
      SPEC_BADGE_SEEN_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, seenBadgeIds: [] })
    );

    const harness = renderHarness();
    expect(harness.getCurrent().hasUnseenSpecBadge).toBe(true);

    await act(async () => {
      markBadgesAsSeen(['IGN-01']);
      await Promise.resolve();
    });

    expect(harness.getCurrent().hasUnseenSpecBadge).toBe(false);

    harness.unmount();
  });
});

