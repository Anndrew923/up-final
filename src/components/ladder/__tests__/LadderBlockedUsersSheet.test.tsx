/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LadderBlockedUsersSheet from '../LadderBlockedUsersSheet';
import { useLadderBlockStore } from '../../../stores/ladderBlockStore';
import { LADDER_BLOCKED_UIDS_STORAGE_KEY } from '../../../services/ladderBlockListService';
import type { LadderBlockedEntry } from '../../../logic/core/ladderBlockList';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const memory = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => {
    memory.clear();
  },
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../hooks/useAndroidBackDismiss', () => ({
  useAndroidBackDismiss: () => undefined,
}));

vi.mock('../../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

function emptyStoreState() {
  return {
    blockedEntries: [] as LadderBlockedEntry[],
    blockedSet: new Set<string>(),
    hydrated: false,
  };
}

function renderSheet(open = true): { unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(<LadderBlockedUsersSheet open={open} onClose={vi.fn()} />);
  });
  return {
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('LadderBlockedUsersSheet', () => {
  beforeEach(() => {
    memory.clear();
    useLadderBlockStore.setState(emptyStoreState());
  });

  afterEach(() => {
    document.body.innerHTML = '';
    memory.clear();
    useLadderBlockStore.setState(emptyStoreState());
  });

  it('shows empty copy when no blocked uids', () => {
    const { unmount } = renderSheet();
    expect(document.body.textContent).toContain('settings.blocked_empty');
    unmount();
  });

  it('renders displayName with micro uid subtitle', () => {
    useLadderBlockStore.setState({
      blockedEntries: [
        { uid: '34RNn2GsqwWCTkYd9KITrWgjg7t1', displayName: '學員甲' },
      ],
      blockedSet: new Set(['34RNn2GsqwWCTkYd9KITrWgjg7t1']),
      hydrated: true,
    });

    const { unmount } = renderSheet();
    expect(document.body.textContent).toContain('學員甲');
    expect(document.body.textContent).toContain('34RNn2...g7t1');
    unmount();
  });

  it('legacy empty-name rows show micro title without duplicate subtitle', () => {
    useLadderBlockStore.setState({
      blockedEntries: [{ uid: '34RNn2GsqwWCTkYd9KITrWgjg7t1', displayName: '' }],
      blockedSet: new Set(['34RNn2GsqwWCTkYd9KITrWgjg7t1']),
      hydrated: true,
    });

    const { unmount } = renderSheet();
    const text = document.body.textContent ?? '';
    expect(text).toContain('34RNn2...g7t1');
    // Title only — micro string appears once (not title + subtitle).
    expect(text.split('34RNn2...g7t1').length - 1).toBe(1);
    unmount();
  });

  it('unblocks a uid and rewrites storage as entry objects', () => {
    memory.set(
      LADDER_BLOCKED_UIDS_STORAGE_KEY,
      JSON.stringify([
        { uid: 'uid-a', displayName: 'Alice' },
        { uid: 'uid-b', displayName: 'Bob' },
      ])
    );
    useLadderBlockStore.setState({
      blockedEntries: [
        { uid: 'uid-a', displayName: 'Alice' },
        { uid: 'uid-b', displayName: 'Bob' },
      ],
      blockedSet: new Set(['uid-a', 'uid-b']),
      hydrated: true,
    });

    const { unmount } = renderSheet();
    const unblockButtons = Array.from(document.body.querySelectorAll('button')).filter((btn) =>
      btn.textContent?.includes('ladder.moderation.unblock')
    );
    expect(unblockButtons).toHaveLength(2);

    act(() => {
      unblockButtons[0]?.click();
    });

    expect(useLadderBlockStore.getState().blockedEntries).toEqual([
      { uid: 'uid-b', displayName: 'Bob' },
    ]);
    expect(JSON.parse(memory.get(LADDER_BLOCKED_UIDS_STORAGE_KEY) ?? '[]')).toEqual([
      { uid: 'uid-b', displayName: 'Bob' },
    ]);
    unmount();
  });
});
