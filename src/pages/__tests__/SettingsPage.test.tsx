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

const RE_CALIBRATE_LABELS: Record<string, string> = {
  'settings.system.reCalibrate': '重新通電',
  'settings.system.reCalibrateKicker': 'RE-CALIBRATION',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => RE_CALIBRATE_LABELS[key] ?? key,
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
    dynoIntelLogCount: 0,
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
    clearDynoIntelHistory: vi.fn(),
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

describe('SettingsPage re-calibrate control', () => {
  afterEach(() => {
    mockUseSettingsPage.mockReset();
    document.body.innerHTML = '';
  });

  it('renders ui-btn affordance with aria-hidden arrow and invokes handler', () => {
    const reCalibrateBoot = vi.fn();
    mockUseSettingsPage.mockReturnValue({
      ...baseSettingsState(),
      reCalibrateBoot,
    });

    const { container, unmount } = renderPage();
    const calibrateBtn = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('重新通電')
    );

    expect(calibrateBtn).toBeDefined();
    expect(calibrateBtn?.className).toContain('ui-btn');
    expect(calibrateBtn?.className).toContain('w-full');
    expect(calibrateBtn?.className).toContain('items-center');
    expect(calibrateBtn?.className).toContain('justify-between');
    expect(calibrateBtn?.className).toContain('border-accent-primary/40');
    expect(calibrateBtn?.textContent).toContain('重新通電');
    expect(calibrateBtn?.textContent).toContain('RE-CALIBRATION');

    const labelRow = calibrateBtn?.querySelector('.flex.items-center.gap-2');
    expect(labelRow?.childElementCount).toBe(2);

    const arrow = calibrateBtn?.querySelector('[aria-hidden="true"]');
    expect(arrow?.textContent).toBe('→');

    act(() => {
      calibrateBtn?.click();
    });
    expect(reCalibrateBoot).toHaveBeenCalledTimes(1);

    unmount();
  });
});

describe('SettingsPage local history control', () => {
  afterEach(() => {
    mockUseSettingsPage.mockReset();
    document.body.innerHTML = '';
  });

  it('keeps clear history behind the shared confirmation dialog', () => {
    const clearDynoIntelHistory = vi.fn();
    mockUseSettingsPage.mockReturnValue({
      ...baseSettingsState(),
      dynoIntelLogCount: 3,
      clearDynoIntelHistory,
    });

    const { container, unmount } = renderPage();
    const clearAction = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('settings.clearDynoHistoryAction')
    );
    expect(clearAction).toBeDefined();

    act(() => clearAction?.click());
    expect(clearDynoIntelHistory).not.toHaveBeenCalled();

    const confirm = Array.from(document.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('dynoIntel.telemetryLog.clearConfirm')
    );
    act(() => confirm?.click());
    expect(clearDynoIntelHistory).toHaveBeenCalledTimes(1);

    unmount();
  });
});
