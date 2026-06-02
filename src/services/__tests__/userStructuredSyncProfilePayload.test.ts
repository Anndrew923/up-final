import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyStructuredProfileToLocal,
  buildStructuredProfileFromLocal,
  ladderProfileForStructuredPush,
} from '../userStructuredSyncService';
import { loadProfile, saveProfile } from '../localStorageService';

vi.mock('../localStorageService', () => ({
  loadProfile: vi.fn(),
  saveProfile: vi.fn(),
  loadScores: vi.fn(() => ({})),
  loadPhysicalProfile: vi.fn(() => null),
  loadFfmiDraft: vi.fn(() => null),
  loadCardioInputs: vi.fn(() => null),
  loadMuscleInputs: vi.fn(() => null),
  loadPowerInputs: vi.fn(() => null),
  loadStrengthInputs: vi.fn(() => null),
  loadGripInputs: vi.fn(() => null),
  loadArmSizeInputs: vi.fn(() => null),
  savePhysicalProfile: vi.fn(),
  saveFfmiDraft: vi.fn(),
  saveCardioInputs: vi.fn(),
  saveMuscleInputs: vi.fn(),
  savePowerInputs: vi.fn(),
  saveStrengthInputs: vi.fn(),
  saveGripInputs: vi.fn(),
  saveArmSizeInputs: vi.fn(),
}));

vi.mock('../../stores/scoreStore', () => ({
  useScoreStore: {
    getState: vi.fn(() => ({ setScores: vi.fn() })),
  },
}));

vi.mock('../firebaseClient', () => ({
  getFirestoreDb: vi.fn(() => null),
  getCurrentFirebaseUser: vi.fn(() => null),
}));

const loadProfileMock = vi.mocked(loadProfile);
const saveProfileMock = vi.mocked(saveProfile);

describe('ladderProfileForStructuredPush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when local portrait is only a data URL', () => {
    loadProfileMock.mockReturnValue({
      uid: 'local',
      displayName: 'ANNDREW',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-06-01T06:53:27.030Z',
    });
    expect(ladderProfileForStructuredPush()).toBeUndefined();
  });

  it('returns stripped profile when local portrait is https', () => {
    const https = 'https://cdn.example.com/a.jpg';
    loadProfileMock.mockReturnValue({
      uid: 'u1',
      displayName: 'Pilot',
      avatarUrl: https,
      updatedAt: '2026-06-01T00:00:00.000Z',
    });
    expect(ladderProfileForStructuredPush()?.avatarUrl).toBe(https);
  });
});

describe('buildStructuredProfileFromLocal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('omits ladderProfile key when only data URL avatar exists', () => {
    loadProfileMock.mockReturnValue({
      uid: 'local',
      displayName: 'ANNDREW',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-06-01T06:53:27.030Z',
    });
    const payload = buildStructuredProfileFromLocal('2026-06-01T06:54:05.856Z');
    expect(payload.ladderProfile).toBeUndefined();
    expect(payload.updatedAt).toBe('2026-06-01T06:54:05.856Z');
  });
});

describe('applyStructuredProfileToLocal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves local data URL avatar when remote ladder profile has none', () => {
    const dataUrl = 'data:image/jpeg;base64,keepme';
    loadProfileMock.mockReturnValue({
      uid: 'local',
      displayName: 'ANNDREW',
      avatarUrl: dataUrl,
      updatedAt: '2026-06-01T06:53:27.030Z',
    });

    applyStructuredProfileToLocal({
      schemaVersion: 1,
      updatedAt: '2026-06-01T06:54:05.856Z',
      scores: {},
      ladderProfile: {
        uid: 'local',
        displayName: 'ANNDREW',
        updatedAt: '2026-06-01T06:54:05.856Z',
      },
    });

    expect(saveProfileMock).toHaveBeenCalledTimes(1);
    const saved = saveProfileMock.mock.calls[0][0];
    expect(saved.avatarUrl).toBe(dataUrl);
  });
});
