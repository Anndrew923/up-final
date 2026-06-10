/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SettingsPage from '../SettingsPage';

const mockUseSettingsPage = vi.fn();

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../hooks/useSettingsPage', () => ({
  useSettingsPage: () => mockUseSettingsPage(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function baseSettingsState() {
  return {
    authStatus: 'signed-out' as const,
    displayName: '',
    email: null,
    isAnonymous: true,
    locale: 'zh-Hant' as const,
    soundEnabled: true,
    soundSettingsVisible: false,
    busyAction: 'none' as const,
    banner: 'idle' as const,
    canSignIn: true,
    canSignOut: false,
    canDeleteAccount: false,
    canRestorePurchases: true,
    goToAbout: vi.fn(),
    goToContact: vi.fn(),
    goToPrivacyPolicy: vi.fn(),
    goToJoinArena: vi.fn(),
    reCalibrateBoot: vi.fn(),
    toggleLocale: vi.fn(),
    toggleSound: vi.fn(),
    signInGoogle: vi.fn(),
    signOut: vi.fn(),
    restorePurchases: vi.fn(),
    deleteAccount: vi.fn(),
  };
}

function renderPage(): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(<SettingsPage />);
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('SettingsPage section hints', () => {
  afterEach(() => {
    mockUseSettingsPage.mockReset();
    document.body.innerHTML = '';
  });

  it('does not render removed section hint copy', () => {
    mockUseSettingsPage.mockReturnValue(baseSettingsState());

    const { container, unmount } = renderPage();
    const text = container.textContent ?? '';

    expect(text).not.toContain('settings.subtitle');
    expect(text).not.toContain('settings.languageHint');
    expect(text).not.toContain('settings.infoHint');
    expect(text).not.toContain('settings.supportHint');
    expect(text).not.toContain('settings.system.reCalibrateHint');
    expect(text).toContain('settings.languageSection');
    expect(text).toContain('settings.infoSection');

    unmount();
  });
});
