/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../../config/routes';
import { SHELL_SCROLL_ID } from '../../../lib/shellScrollLock';
import AppShell from '../AppShell';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../../hooks/useSpecBadgeUnlockToast', () => ({
  useSpecBadgeUnlockToast: () => undefined,
}));

vi.mock('../../../hooks/usePushNotificationLifecycle', () => ({
  usePushNavigateBridge: () => undefined,
}));

vi.mock('../../../hooks/useBootSequence', () => ({
  useBootSequence: () => ({ shouldShow: false, completeBoot: vi.fn() }),
}));

vi.mock('../../../hooks/useNavSensoryFeedback', () => ({
  useNavSensoryFeedback: () => undefined,
}));

vi.mock('../../../stores/uiInteractionStore', () => ({
  useShellInteractionBlocked: () => false,
}));

vi.mock('../../navigation/BottomNav', () => ({
  default: () => <nav data-testid="bottom-nav" />,
}));

vi.mock('../../navigation/TopProgressBar', () => ({
  default: () => null,
}));

vi.mock('../../navigation/ShellAnimatedOutlet', () => ({
  default: () => <div data-testid="shell-outlet" />,
}));

vi.mock('../../dynoIntel/DynoIntelConsole', () => ({
  default: () => null,
}));

vi.mock('../../notifications/SpecBadgeUnlockBanner', () => ({
  default: () => null,
}));

vi.mock('../../onboarding/BootSequenceOverlay', () => ({
  default: () => null,
}));

vi.mock('../HudBackControl', () => ({
  default: () => <button type="button" data-testid="hud-back">BACK</button>,
}));

vi.mock('../HudProfileControls', () => ({
  default: () => <div data-testid="hud-profile">HUD</div>,
}));

function renderShell(path: string): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="*"
            element={
              <AppShell>
                <div data-testid="page">page</div>
              </AppShell>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  });
  return { container, root };
}

describe('AppShell Home HUD clearance', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses full shell-top on Home (not compact) so radar clears the HUD', () => {
    const { container, root } = renderShell(ROUTES.home);
    const scroll = container.querySelector(`#${SHELL_SCROLL_ID}`);
    expect(scroll?.className).toContain('pt-shell-top');
    expect(scroll?.className).not.toContain('pt-shell-top-compact');
    act(() => root.unmount());
  });

  it('keeps ladder on compact shell-top', () => {
    const { container, root } = renderShell(ROUTES.ladder);
    const scroll = container.querySelector(`#${SHELL_SCROLL_ID}`);
    expect(scroll?.className).toContain('pt-shell-top-compact');
    act(() => root.unmount());
  });

  it('anchors Home HUD frame to the right rail without full-width inset-x-0 cover', () => {
    const { container, root } = renderShell(ROUTES.home);
    const frame = container.querySelector('#layer-shell-frame');
    expect(frame?.getAttribute('data-shell-hud-anchor')).toBe('home-right');
    expect(frame?.className).toContain('right-0');
    expect(frame?.className).toContain('fixed');
    expect(frame?.className).toContain('top-0');
    expect(frame?.className).toContain('pointer-events-none');
    expect(frame?.className).not.toContain('inset-x-0');
    expect(frame?.className).not.toMatch(/\bbg-bg-base\b/);
    expect(frame?.className).not.toMatch(/\bbg-black\b/);
    expect(container.querySelector('[data-testid="hud-back"]')).toBeNull();
    expect(container.querySelector('[data-testid="hud-profile"]')).toBeTruthy();
    act(() => root.unmount());
  });

  it('keeps non-Home HUD frame full-width for back + profile', () => {
    const { container, root } = renderShell(ROUTES.ladder);
    const frame = container.querySelector('#layer-shell-frame');
    expect(frame?.getAttribute('data-shell-hud-anchor')).toBe('full-width');
    expect(frame?.className).toContain('inset-x-0');
    expect(container.querySelector('[data-testid="hud-back"]')).toBeTruthy();
    act(() => root.unmount());
  });
});
