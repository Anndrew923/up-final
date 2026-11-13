/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuildDoc } from '../../../types/guild';
import CrewIdentityBanner from '../CrewIdentityBanner';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'crew.banner.members') {
        return `${String(options?.count ?? '')} / ${String(options?.max ?? '')} 人`;
      }
      if (key === 'crew.banner.inviteLabel') return 'Invite';
      if (key === 'crew.banner.copy') return 'Copy';
      if (key === 'crew.banner.copied') return 'Copied';
      if (key === 'crew.banner.copyFail') return 'Copy failed';
      return key;
    },
  }),
}));

const guild: GuildDoc = {
  id: 'g1',
  name: '粗男教',
  tag: 'UP',
  coachUid: 'u1',
  inviteCode: 'VKEM8Y',
  memberCount: 7,
  maxMembers: 30,
  memberUids: [],
  members: [],
  createdAt: 't0',
  updatedAt: 't0',
};

describe('CrewIdentityBanner', () => {
  let root: Root;
  let host: HTMLDivElement;
  const writeText = vi.fn(async () => undefined);

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('renders compact title + members/invite meta without card chrome', () => {
    act(() => {
      root.render(<CrewIdentityBanner guild={guild} />);
    });

    const banner = host.querySelector('[data-testid="crew-identity-banner"]');
    expect(banner).toBeTruthy();
    expect(banner?.querySelector('h1')?.textContent).toContain('[UP]');
    expect(banner?.querySelector('h1')?.textContent).toContain('粗男教');
    expect(banner?.textContent).toContain('7 / 30 人');
    expect(banner?.textContent).toContain('VKE-M8Y');
    expect(banner?.className).not.toContain('rounded-2xl');
  });

  it('copies invite code and shows copied feedback', async () => {
    act(() => {
      root.render(<CrewIdentityBanner guild={guild} />);
    });

    const copyBtn = host.querySelector(
      '[data-testid="crew-invite-copy"]'
    ) as HTMLButtonElement;
    await act(async () => {
      copyBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith('VKEM8Y');
    expect(copyBtn.textContent).toContain('Copied');
    expect(copyBtn.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe(
      'polite'
    );
  });

  it('shows copyFail status when clipboard write rejects', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));

    act(() => {
      root.render(<CrewIdentityBanner guild={guild} />);
    });

    const copyBtn = host.querySelector(
      '[data-testid="crew-invite-copy"]'
    ) as HTMLButtonElement;
    await act(async () => {
      copyBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(copyBtn.textContent).toContain('Copy failed');
    expect(copyBtn.getAttribute('aria-label')).toContain('Copy failed');
  });
});
