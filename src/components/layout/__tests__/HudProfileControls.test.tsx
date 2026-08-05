/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { useEntitlementStore } from '../../../stores/entitlementStore';
import { useUiInteractionStore } from '../../../stores/uiInteractionStore';
import HudProfileControls from '../HudProfileControls';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../HudAvatar', () => ({
  default: () => <span data-testid="hud-avatar">AV</span>,
}));

function renderHud(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <HudProfileControls />
        </MemoryRouter>
      </I18nextProvider>
    );
  });
  return { container, root };
}

describe('HudProfileControls Pro honor mark', () => {
  beforeEach(() => {
    useEntitlementStore.getState().resetEntitlement();
    useUiInteractionStore.setState({ isHomeResonanceBlocking: false });
  });

  afterEach(() => {
    useEntitlementStore.getState().resetEntitlement();
    document.body.innerHTML = '';
  });

  it('hides metal ProBadge when not Pro', () => {
    const { container, root } = renderHud();
    expect(container.querySelector('[class*="from-amber-300"]')).toBeNull();
    expect(container.querySelector('[data-testid="hud-avatar"]')).not.toBeNull();
    act(() => root.unmount());
  });

  it('shows metal ProBadge before settings and avatar when Pro', () => {
    useEntitlementStore.getState().setSubscriptionStatus('pro');
    expect(useEntitlementStore.getState().isPro).toBe(true);

    const { container, root } = renderHud();
    const html = container.innerHTML;
    expect(html).toContain('from-amber-300');
    expect(html).toContain('to-orange-500');
    const badgeIdx = html.indexOf('from-amber-300');
    const settingsIdx = html.indexOf('Open settings');
    const avatarIdx = html.indexOf('hud-avatar');
    expect(badgeIdx).toBeGreaterThan(-1);
    expect(settingsIdx).toBeGreaterThan(badgeIdx);
    expect(avatarIdx).toBeGreaterThan(settingsIdx);
    act(() => root.unmount());
  });
});
