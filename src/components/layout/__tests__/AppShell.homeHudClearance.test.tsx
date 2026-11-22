/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../../config/routes';
import { SHELL_SCROLL_ID } from '../../../lib/shellScrollLock';
import AppShell, {
  HOME_SCROLL_COMPOSITOR_CLASS,
  HOME_SHELL_TOP_SPACER_CLASS,
} from '../AppShell';

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
  default: () => (
    <button type="button" data-testid="hud-back">
      BACK
    </button>
  ),
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

  it('uses pt-0 + in-flow shell-top spacer on Home (not overflow padding)', () => {
    const { container, root } = renderShell(ROUTES.home);
    const scroll = container.querySelector(`#${SHELL_SCROLL_ID}`);
    const scrollClasses = scroll?.className.split(/\s+/) ?? [];
    expect(scrollClasses).toContain('pt-0');
    // WHY exact token: Home must stay `pt-0` + in-flow spacer (never overflow `pt-shell-top`).
    expect(scrollClasses).not.toContain('pt-shell-top');
    expect(scroll?.getAttribute('data-webkit-scroll-isolate')).toBe('home');
    for (const token of HOME_SCROLL_COMPOSITOR_CLASS.split(/\s+/)) {
      expect(scrollClasses).toContain(token);
    }

    const spacer = container.querySelector('[data-testid="home-shell-top-spacer"]');
    expect(spacer).toBeTruthy();
    expect(spacer?.className).toBe(HOME_SHELL_TOP_SPACER_CLASS);
    expect(HOME_SHELL_TOP_SPACER_CLASS).toContain('h-shell-top');
    expect(spacer?.getAttribute('aria-hidden')).toBe('true');
    expect(scroll?.firstElementChild).toBe(spacer);
    act(() => root.unmount());
  });

  it('keeps ladder on full shell-top without a Home spacer or compositor fence', () => {
    const { container, root } = renderShell(ROUTES.ladder);
    const scroll = container.querySelector(`#${SHELL_SCROLL_ID}`);
    const scrollClasses = scroll?.className.split(/\s+/) ?? [];
    // WHY: Frosted full-width HUD matches `shell-top`; compact inset clipped the ladder title.
    expect(scrollClasses).toContain('pt-shell-top');
    expect(scroll?.getAttribute('data-webkit-scroll-isolate')).toBeNull();
    expect(scroll?.className).not.toContain('isolation-isolate');
    expect(container.querySelector('[data-testid="home-shell-top-spacer"]')).toBeNull();
    act(() => root.unmount());
  });

  it('anchors Home HUD frame to a w-fit right rail without bg mask', () => {
    const { container, root } = renderShell(ROUTES.home);
    const frame = container.querySelector('#layer-shell-frame');
    expect(frame?.getAttribute('data-shell-hud-anchor')).toBe('home-right');
    expect(frame?.className).toContain('right-0');
    expect(frame?.className).toContain('w-fit');
    expect(frame?.className).toContain('fixed');
    expect(frame?.className).toContain('top-0');
    expect(frame?.className).toContain('pointer-events-none');
    expect(frame?.className).not.toContain('inset-x-0');
    expect(frame?.className).not.toMatch(/\bbg-bg-base\b/);
    expect(frame?.className).not.toMatch(/\bbg-bg-base\/90\b/);
    expect(frame?.className).not.toMatch(/\bbg-black\b/);
    expect(frame?.className).not.toMatch(/\bbg-zinc-950\b/);
    expect(frame?.className).not.toContain('backdrop-blur-md');
    expect(container.querySelector('[data-testid="hud-back"]')).toBeNull();
    expect(container.querySelector('[data-testid="hud-profile"]')).toBeTruthy();
    act(() => root.unmount());
  });

  it('keeps non-Home HUD frame full-width for back + profile', () => {
    const { container, root } = renderShell(ROUTES.ladder);
    const frame = container.querySelector('#layer-shell-frame');
    expect(frame?.getAttribute('data-shell-hud-anchor')).toBe('full-width');
    expect(frame?.className).toContain('inset-x-0');
    expect(frame?.className).not.toContain('w-fit');
    // WHY: Frosted mask blocks scroll text under back + PRO without touching Home's transparent rail.
    expect(frame?.className).toContain('bg-bg-base/90');
    expect(frame?.className).toContain('backdrop-blur-md');
    expect(frame?.className).toContain('border-b');
    expect(container.querySelector('[data-testid="hud-back"]')).toBeTruthy();
    act(() => root.unmount());
  });
});
