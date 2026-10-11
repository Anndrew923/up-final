/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCloudSyncCard } from '../useCloudSyncCard';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockUseUiGate = vi.fn();
const mockFetchCloudSyncStatus = vi.fn();
const mockBackupLocalToCloud = vi.fn();
const mockRestoreCloudToLocal = vi.fn();

vi.mock('../useUiGate', () => ({
  useUiGate: () => mockUseUiGate(),
}));

vi.mock('../../services/cloudSyncService', () => ({
  fetchCloudSyncStatus: (...args: unknown[]) => mockFetchCloudSyncStatus(...args),
  backupLocalToCloud: (...args: unknown[]) => mockBackupLocalToCloud(...args),
  restoreCloudToLocal: (...args: unknown[]) => mockRestoreCloudToLocal(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function Probe({ onReady }: { onReady: (api: ReturnType<typeof useCloudSyncCard>) => void }) {
  const api = useCloudSyncCard();
  onReady(api);
  return null;
}

function mountProbe(): {
  getApi: () => ReturnType<typeof useCloudSyncCard>;
  unmount: () => void;
} {
  let api: ReturnType<typeof useCloudSyncCard> | null = null;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <Probe
        onReady={(value) => {
          api = value;
        }}
      />
    );
  });
  return {
    getApi: () => {
      if (!api) throw new Error('useCloudSyncCard not ready');
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

describe('useCloudSyncCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCloudSyncStatus.mockResolvedValue({ exists: false, cloudUpdatedAt: null });
    mockBackupLocalToCloud.mockResolvedValue({ ok: true });
    mockRestoreCloudToLocal.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('does not probe Firestore when gate blocks sync', async () => {
    mockUseUiGate.mockReturnValue({ kind: 'pro', joinArenaFrom: 'backup' });
    const { getApi, unmount } = mountProbe();

    await act(async () => {
      await Promise.resolve();
    });

    expect(getApi().canSync).toBe(false);
    expect(mockFetchCloudSyncStatus).not.toHaveBeenCalled();
    expect(getApi().status).toEqual({ exists: false, cloudUpdatedAt: null });
    unmount();
  });

  it('probes status when eligible and requires confirm before restore', async () => {
    mockUseUiGate.mockReturnValue({ kind: 'none' });
    mockFetchCloudSyncStatus.mockResolvedValue({
      exists: true,
      cloudUpdatedAt: '2026-10-10T10:30:00.000Z',
    });

    const { getApi, unmount } = mountProbe();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockFetchCloudSyncStatus).toHaveBeenCalled();
    expect(getApi().status.exists).toBe(true);

    act(() => {
      getApi().requestRestore();
    });
    expect(getApi().restoreConfirmOpen).toBe(true);
    expect(mockRestoreCloudToLocal).not.toHaveBeenCalled();

    await act(async () => {
      getApi().confirmRestore();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockRestoreCloudToLocal).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('no-ops backup when not eligible', async () => {
    mockUseUiGate.mockReturnValue({ kind: 'auth' });
    const { getApi, unmount } = mountProbe();

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      getApi().requestBackup();
    });

    expect(mockBackupLocalToCloud).not.toHaveBeenCalled();
    unmount();
  });
});
