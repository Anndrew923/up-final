/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsPage from '../SettingsPage';
import { useLadderBlockStore } from '../../stores/ladderBlockStore';

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
    t: (key: string, opts?: { count?: number }) => {
      if (key === 'settings.blocked_count' && opts?.count != null) {
        return `${opts.count} 人`;
      }
      return RE_CALIBRATE_LABELS[key] ?? key;
    },
  }),
}));

function baseSettingsState() {
  return {
    authStatus: 'signed-out' as const,
    displayName: '',
    email: null,
    isAnonymous: true,
    isPro: false,
    membership: {
      kind: 'free' as const,
      displayDate: null,
      remainingDays: null,
      promoPaused: false,
    },
    locale: 'zh-Hant' as const,
    soundEnabled: true,
    soundSettingsVisible: false,
    busyAction: 'none' as const,
    banner: 'idle' as const,
    canSignIn: true,
    showAppleSignIn: false,
    canSignOut: false,
    canDeleteAccount: false,
    canRestorePurchases: true,
    dynoIntelLogCount: 0,
    goToAbout: vi.fn(),
    goToContact: vi.fn(),
    goToPrivacyPolicy: vi.fn(),
    goToJoinArena: vi.fn(),
    goToProUpsell: vi.fn(),
    reCalibrateBoot: vi.fn(),
    toggleLocale: vi.fn(),
    toggleSound: vi.fn(),
    signInGoogle: vi.fn(),
    signInApple: vi.fn(),
    signOut: vi.fn(),
    restorePurchases: vi.fn(),
    openManageSubscription: vi.fn(),
    clearDynoIntelHistory: vi.fn(),
    deleteAccount: vi.fn(),
    isAdmin: false,
    adminCheckReady: true,
    goToAdmin: vi.fn(),
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

beforeEach(() => {
  useLadderBlockStore.setState({
    blockedEntries: [],
    blockedSet: new Set(),
    hydrated: false,
  });
});

describe('SettingsPage membership card', () => {
  afterEach(() => {
    mockUseSettingsPage.mockReset();
    document.body.innerHTML = '';
  });

  it('renders free plan and unlocks Pro via Pro upsell funnel', () => {
    const goToProUpsell = vi.fn();
    mockUseSettingsPage.mockReturnValue({
      ...baseSettingsState(),
      goToProUpsell,
    });

    const { container, unmount } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('settings.membership.planFree');
    expect(text).toContain('settings.membership.unlockPro');

    const unlockBtn = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('settings.membership.unlockPro')
    );
    act(() => unlockBtn?.click());
    expect(goToProUpsell).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('renders promo expiry and subscribe CTA', () => {
    const goToProUpsell = vi.fn();
    mockUseSettingsPage.mockReturnValue({
      ...baseSettingsState(),
      isPro: true,
      membership: {
        kind: 'promo',
        displayDate: '2026/07/31',
        remainingDays: 45,
        promoPaused: false,
      },
      goToProUpsell,
    });

    const { container, unmount } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('settings.membership.planPromo');
    expect(text).toContain('settings.membership.promoExpiry');
    expect(text).toContain('settings.membership.subscribeNow');

    const subscribeBtn = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('settings.membership.subscribeNow')
    );
    act(() => subscribeBtn?.click());
    expect(goToProUpsell).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('renders store renewal with paused trial hint and manage subscription', () => {
    const openManageSubscription = vi.fn().mockResolvedValue(undefined);
    mockUseSettingsPage.mockReturnValue({
      ...baseSettingsState(),
      isPro: true,
      membership: {
        kind: 'store',
        displayDate: '2026/07/01',
        remainingDays: null,
        promoPaused: true,
      },
      openManageSubscription,
    });

    const { container, unmount } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('settings.membership.planStore');
    expect(text).toContain('settings.membership.storeRenewal');
    expect(text).toContain('settings.membership.promoPausedHint');

    const manageBtn = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('settings.manageSubscription')
    );
    expect(manageBtn).toBeDefined();
    act(() => manageBtn?.click());
    expect(openManageSubscription).toHaveBeenCalledTimes(1);

    unmount();
  });
});

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
    expect(text).toContain('settings.sectionAccountPro');
    expect(text).toContain('settings.sectionLadderPrivacy');
    expect(text).toContain('settings.sectionLocalDiagnostics');
    expect(text).toContain('settings.sectionPreferences');
    expect(text).toContain('settings.languageSection');
    expect(text).toContain('settings.supportSection');
    expect(text).toContain('settings.openAbout');
    expect(text).toContain('settings.blocked_users_title');
    expect(text).toContain('settings.blocked_empty');
    expect(text).toContain('0 人');

    unmount();
  });
});

describe('SettingsPage re-calibrate control', () => {
  afterEach(() => {
    mockUseSettingsPage.mockReset();
    document.body.innerHTML = '';
  });

  it('renders diagnostics list row and invokes handler', () => {
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
    expect(calibrateBtn?.textContent).toContain('重新通電');
    expect(calibrateBtn?.textContent).toContain('RE-CALIBRATION');
    expect(calibrateBtn?.textContent).toContain('›');

    act(() => {
      calibrateBtn?.click();
    });
    expect(reCalibrateBoot).toHaveBeenCalledTimes(1);

    unmount();
  });
});

describe('SettingsPage restore toast chrome clearance', () => {
  afterEach(() => {
    mockUseSettingsPage.mockReset();
    document.body.innerHTML = '';
  });

  it('docks restore success toast above BottomNav / DYNO chrome', () => {
    mockUseSettingsPage.mockReturnValue({
      ...baseSettingsState(),
      banner: 'restore-ok',
    });

    const { unmount } = renderPage();
    const toast = document.querySelector('[role="status"]');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('settings.restorePurchasesSuccess');
    expect((toast as HTMLElement).style.bottom).toContain('142px');
    expect((toast as HTMLElement).style.bottom).toContain('safe-area-inset-bottom');

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
      button.textContent?.includes('settings.clearDynoHistoryTitle')
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

describe('SettingsPage IA Phase A', () => {
  afterEach(() => {
    mockUseSettingsPage.mockReset();
    document.body.innerHTML = '';
  });

  it('keeps sign-out in the danger zone and blocked list under ladder privacy', () => {
    const signOut = vi.fn();
    mockUseSettingsPage.mockReturnValue({
      ...baseSettingsState(),
      canSignOut: true,
      canSignIn: false,
      authStatus: 'signed-in',
      isAnonymous: false,
      displayName: 'Tester',
      signOut,
    });
    useLadderBlockStore.setState({
      blockedEntries: [{ uid: 'u1', displayName: 'A' }],
      blockedSet: new Set(['u1']),
      hydrated: true,
    });

    const { container, unmount } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('settings.dangerZone');
    expect(text).toContain('1 人');
    expect(text).not.toContain('settings.blocked_empty');

    const signOutBtn = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('settings.signOut')
    );
    expect(signOutBtn).toBeDefined();
    act(() => signOutBtn?.click());
    expect(signOut).toHaveBeenCalledTimes(1);

    unmount();
  });
});
