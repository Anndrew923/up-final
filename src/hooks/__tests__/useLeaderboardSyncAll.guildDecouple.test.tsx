/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockCheckFullSyncAllowed = vi.fn();
const mockRecordFullSyncAllowed = vi.fn();
const mockSyncGuildLadderScore = vi.fn();
const mockFetchUserGuildBinding = vi.fn();
const mockGetCurrentFirebaseUser = vi.fn();
const mockGetLadderUploadIdentity = vi.fn();
const mockResolveGuildCallableIdentity = vi.fn();

vi.mock('../../services/fullSyncRateLimitService', () => ({
  checkFullSyncAllowed: (...args: unknown[]) => mockCheckFullSyncAllowed(...args),
  recordFullSyncAllowed: (...args: unknown[]) => mockRecordFullSyncAllowed(...args),
}));

vi.mock('../../services/guildCallableService', () => ({
  syncGuildLadderScore: (...args: unknown[]) => mockSyncGuildLadderScore(...args),
}));

vi.mock('../../services/guildLadderCacheService', () => ({
  fetchUserGuildBinding: (...args: unknown[]) => mockFetchUserGuildBinding(...args),
  invalidateGuildLadderCache: vi.fn(),
}));

vi.mock('../../services/firebaseClient', () => ({
  getCurrentFirebaseUser: () => mockGetCurrentFirebaseUser(),
}));

vi.mock('../../services/ladderIdentityService', () => ({
  getLadderUploadIdentity: () => mockGetLadderUploadIdentity(),
}));

vi.mock('../../services/ladderAvatarStorageService', () => ({
  resolveGuildCallableIdentity: (...args: unknown[]) =>
    mockResolveGuildCallableIdentity(...args),
}));

vi.mock('../../services/hapticService', () => ({
  hapticService: { trigger: vi.fn() },
}));

vi.mock('../../services/localStorageService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/localStorageService')>();
  return {
    ...actual,
    loadPhysicalProfile: () => null,
    loadCardioInputs: () => null,
    loadStrengthInputs: () => null,
    loadPowerInputs: () => null,
    loadMuscleInputs: () => null,
  };
});

vi.mock('../useMergedScoresFromLocalStores', () => ({
  useMergedScoresFromLocalStores: () => ({
    strength: 80,
    explosivePower: 70,
    cardio: 60,
    muscleMass: 75,
    bodyFat: 65,
    gripStrength: 55,
  }),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (sel: (s: { uid: string; status: string; isAnonymous: boolean }) => unknown) =>
    sel({ uid: 'u1', status: 'signed-in', isAnonymous: false }),
}));

vi.mock('../../stores/entitlementSelectors', () => ({
  readEntitlementSnapshot: () => ({ isPro: true }),
}));

vi.mock('../useLeaderboardUpload', () => ({
  resolveLeaderboardUploadGate: () => 'ok',
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import { useLeaderboardSyncAll } from '../useLeaderboardSyncAll';
import { GUILD_SYNC_TAP_DEBOUNCE_MS } from '../../logic/core/guildSyncDebounce';

function Probe({
  onReady,
}: {
  onReady: (api: ReturnType<typeof useLeaderboardSyncAll>) => void;
}) {
  const api = useLeaderboardSyncAll();
  onReady(api);
  return null;
}

function mountHook(): {
  getApi: () => ReturnType<typeof useLeaderboardSyncAll>;
  unmount: () => void;
} {
  let api: ReturnType<typeof useLeaderboardSyncAll> | null = null;
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
      if (!api) throw new Error('useLeaderboardSyncAll not ready');
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

describe('useLeaderboardSyncAll guild/global rate-limit decouple', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockCheckFullSyncAllowed.mockReturnValue({ allowed: true, remainingToday: 3 });
    mockRecordFullSyncAllowed.mockReset();
    mockSyncGuildLadderScore.mockResolvedValue({ ok: true, skipped: false, guildId: 'g1' });
    mockFetchUserGuildBinding.mockResolvedValue({ guildId: 'g1', guildRole: 'member' });
    mockGetCurrentFirebaseUser.mockReturnValue({ uid: 'u1', isAnonymous: false });
    mockGetLadderUploadIdentity.mockReturnValue({
      displayName: 'Pilot',
      avatarUrl: null,
    });
    mockResolveGuildCallableIdentity.mockResolvedValue({
      displayName: 'Pilot',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('syncGuildOnly upgrades data URL avatar to https before Callable', async () => {
    mockResolveGuildCallableIdentity.mockResolvedValue({
      displayName: 'Pilot',
      avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/test/o/avatar.jpg?v=1',
    });

    const { getApi, unmount } = mountHook();

    await act(async () => {
      await getApi().syncGuildOnly();
    });

    expect(mockResolveGuildCallableIdentity).toHaveBeenCalled();
    expect(mockSyncGuildLadderScore).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/test/o/avatar.jpg?v=1',
      })
    );
    expect(mockSyncGuildLadderScore.mock.calls[0][0].avatarUrl).not.toMatch(/^data:/);

    unmount();
  });

  it('syncGuildOnly does not check or record global full-sync quota', async () => {
    mockCheckFullSyncAllowed.mockReturnValue({
      allowed: false,
      reason: 'full-sync-cooldown',
      remainingToday: 2,
      nextAllowedAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    });

    const { getApi, unmount } = mountHook();

    mockCheckFullSyncAllowed.mockClear();
    mockRecordFullSyncAllowed.mockClear();

    await act(async () => {
      await getApi().syncGuildOnly();
    });

    expect(mockSyncGuildLadderScore).toHaveBeenCalledTimes(1);
    expect(mockCheckFullSyncAllowed).not.toHaveBeenCalled();
    expect(mockRecordFullSyncAllowed).not.toHaveBeenCalled();

    unmount();
  });

  it('applies a short in-memory debounce between guild sync taps', async () => {
    const { getApi, unmount } = mountHook();

    await act(async () => {
      await getApi().syncGuildOnly();
    });
    expect(mockSyncGuildLadderScore).toHaveBeenCalledTimes(1);
    expect(getApi().guildSyncBlocked).toBe(true);

    await act(async () => {
      await getApi().syncGuildOnly();
    });
    expect(mockSyncGuildLadderScore).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(GUILD_SYNC_TAP_DEBOUNCE_MS);
    });
    expect(getApi().guildSyncBlocked).toBe(false);

    await act(async () => {
      await getApi().syncGuildOnly();
    });
    expect(mockSyncGuildLadderScore).toHaveBeenCalledTimes(2);

    unmount();
  });
});
