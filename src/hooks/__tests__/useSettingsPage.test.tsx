/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../config/routes';
import { useSettingsPage } from '../useSettingsPage';

const resetBoot = vi.fn();

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const navigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('../useBootSequence', () => ({
  useBootSequence: () => ({ resetBoot }),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      status: 'signed-out',
      displayName: '',
      email: null,
      isAnonymous: true,
    }),
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

vi.mock('../../i18n', () => ({
  default: {
    resolvedLanguage: 'zh-Hant',
    language: 'zh-Hant',
    changeLanguage: vi.fn(),
  },
  toSupportedLng: (lng: string) => (lng === 'en' ? 'en' : 'zh-Hant'),
}));

vi.mock('../../services/accountDeletionService', () => ({
  deleteSignedInAccount: vi.fn(),
}));

vi.mock('../../services/firebaseClient', () => ({
  signInWithGoogleWeb: vi.fn(),
  signOutFirebase: vi.fn(),
}));

vi.mock('../../services/subscriptionService', () => ({
  restorePurchasesFromDevice: vi.fn(),
}));

vi.mock('../../services/sensoryPreferences', () => ({
  sensoryPreferences: {
    isSoundEnabled: () => true,
    setSoundEnabled: vi.fn(),
  },
}));

vi.mock('../../services/soundService', () => ({
  soundService: { stopAll: vi.fn() },
}));

function Probe({ onReady }: { onReady: (api: ReturnType<typeof useSettingsPage>) => void }) {
  const api = useSettingsPage();
  onReady(api);
  return null;
}

function mountProbe(): { getApi: () => ReturnType<typeof useSettingsPage>; unmount: () => void } {
  let api: ReturnType<typeof useSettingsPage> | null = null;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <Probe
          onReady={(value) => {
            api = value;
          }}
        />
      </MemoryRouter>
    );
  });
  return {
    getApi: () => {
      if (!api) throw new Error('settings page hook not ready');
      return api;
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useSettingsPage reCalibrateBoot', () => {
  beforeEach(() => {
    navigate.mockReset();
    resetBoot.mockReset();
    vi.spyOn(window, 'confirm').mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('skips reset when confirm is dismissed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { getApi, unmount } = mountProbe();

    act(() => {
      getApi().reCalibrateBoot();
    });

    expect(window.confirm).toHaveBeenCalledWith('settings.system.reCalibrateConfirm');
    expect(resetBoot).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    unmount();
  });

  it('resets boot and navigates home when confirm is accepted', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { getApi, unmount } = mountProbe();

    act(() => {
      getApi().reCalibrateBoot();
    });

    expect(resetBoot).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(ROUTES.home, { replace: true });

    unmount();
  });
});
