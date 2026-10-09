/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LadderIdentityChip from '../LadderIdentityChip';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'ladder.syncAll.identityChipEmpty') return 'Unnamed';
      if (key === 'ladder.syncAll.identityChipEditAria') {
        return `Edit ${String(options?.name ?? '')}`;
      }
      return key;
    },
  }),
}));

describe('LadderIdentityChip', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('falls back to initial when avatar image errors', () => {
    act(() => {
      root.render(
        <LadderIdentityChip
          identity={{
            ready: true,
            displayName: '普通人',
            initial: '普',
            avatarUrl: 'https://example.com/broken.jpg',
          }}
        />
      );
    });

    const img = container.querySelector('img');
    expect(img).not.toBeNull();

    act(() => {
      img?.dispatchEvent(new Event('error', { bubbles: true }));
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('普');
    expect(container.textContent).toContain('普通人');
  });

  it('retries avatar when avatarUrl changes after a prior failure', () => {
    act(() => {
      root.render(
        <LadderIdentityChip
          identity={{
            ready: true,
            displayName: 'Pilot',
            initial: 'P',
            avatarUrl: 'https://example.com/broken.jpg',
          }}
        />
      );
    });

    act(() => {
      container.querySelector('img')?.dispatchEvent(new Event('error', { bubbles: true }));
    });
    expect(container.querySelector('img')).toBeNull();

    act(() => {
      root.render(
        <LadderIdentityChip
          identity={{
            ready: true,
            displayName: 'Pilot',
            initial: 'P',
            avatarUrl: 'https://example.com/ok.jpg',
          }}
        />
      );
    });

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://example.com/ok.jpg');
  });

  it('shows initial when avatarUrl is absent', () => {
    act(() => {
      root.render(
        <LadderIdentityChip
          identity={{
            ready: true,
            displayName: 'Pilot',
            initial: 'P',
            avatarUrl: undefined,
          }}
        />
      );
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('P');
  });
});
