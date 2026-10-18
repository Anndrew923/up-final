/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RadarPkBattleBanner from '../RadarPkBattleBanner';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../ProAvatarRing', () => ({
  default: () => <div data-testid="avatar" />,
}));

describe('RadarPkBattleBanner', () => {
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  it('renders vector badge icon with status attr and no emoji in copy', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <RadarPkBattleBanner
          target={{ displayName: 'Rival', score: 80, initial: 'R' }}
          viewer={{ displayName: 'Anndrew', score: 70, initial: 'A' }}
          vsLabel="VS"
          badgeLabel="4W 2L · Dominance (+10.00)"
          badgeStatus="dominance"
          ariaLabel="Rival versus Anndrew"
        />
      );
    });

    const badge = document.body.querySelector(
      '[data-testid="radar-pk-battle-badge"]'
    ) as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('data-badge-status')).toBe('dominance');
    expect(badge.querySelector('svg')).toBeTruthy();
    expect(badge.textContent).toContain('Dominance');
    expect(badge.textContent).not.toContain('🔥');
    expect(badge.textContent).not.toContain('⚡');
    expect(badge.textContent).not.toContain('💥');
  });

  it('maps even status for shield icon slot', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <RadarPkBattleBanner
          target={{ displayName: 'Rival', score: 70, initial: 'R' }}
          viewer={{ displayName: 'Me', score: 70, initial: 'M' }}
          vsLabel="VS"
          badgeLabel="3W 3L · Evenly matched"
          badgeStatus="even"
          ariaLabel="Rival versus Me"
        />
      );
    });

    const badge = document.body.querySelector(
      '[data-testid="radar-pk-battle-badge"]'
    ) as HTMLElement;
    expect(badge.getAttribute('data-badge-status')).toBe('even');
    expect(badge.querySelector('svg')).toBeTruthy();
  });
});
