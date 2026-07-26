import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: vi.fn(),
  safeSetItem: vi.fn(),
}));

vi.mock('../localStorageService', () => ({
  loadPhysicalProfile: vi.fn(),
  savePhysicalProfile: vi.fn(),
}));

import { safeGetItem, safeSetItem } from '../../lib/safeLocalStorage';
import { loadPhysicalProfile, savePhysicalProfile } from '../localStorageService';
import {
  dismissFilterTagNudge,
  dismissLadderTagsPrompt,
  hasDismissedFilterTagNudge,
  hasDismissedLadderTagsPrompt,
  maybeRehydrateLocalLadderTagsFromCloud,
  settleLadderTagsWithCloud,
  shouldShowLadderFilterTagsNudge,
  shouldShowLadderTagsPrompt,
} from '../ladderTagsPromptPrefService';

const emptyTagsProfile = {
  gender: 'male' as const,
  age: 30,
  heightCm: 180,
  weightKg: 80,
  jobCategory: '' as const,
  countryCode: '' as const,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ladderTagsPromptPrefService', () => {
  beforeEach(() => {
    vi.mocked(safeGetItem).mockReset();
    vi.mocked(safeSetItem).mockReset();
    vi.mocked(loadPhysicalProfile).mockReset();
    vi.mocked(savePhysicalProfile).mockReset();
  });

  it('reads and persists entry dismiss flag', () => {
    vi.mocked(safeGetItem).mockReturnValue('1');
    expect(hasDismissedLadderTagsPrompt()).toBe(true);
    expect(safeGetItem).toHaveBeenCalledWith('up.ladder.tagsPrompt.dismissed.v1');

    dismissLadderTagsPrompt();
    expect(safeSetItem).toHaveBeenCalledWith('up.ladder.tagsPrompt.dismissed.v1', '1');
  });

  it('reads and persists filter-nudge dismiss flag on a separate key', () => {
    vi.mocked(safeGetItem).mockReturnValue('1');
    expect(hasDismissedFilterTagNudge()).toBe(true);
    expect(safeGetItem).toHaveBeenCalledWith('up.ladder.filterTagsNudge.dismissed.v1');

    dismissFilterTagNudge();
    expect(safeSetItem).toHaveBeenCalledWith('up.ladder.filterTagsNudge.dismissed.v1', '1');
  });

  it('offers entry prompt only when both local and cloud lack Job/Country', () => {
    vi.mocked(safeGetItem).mockReturnValue(null);
    vi.mocked(loadPhysicalProfile).mockReturnValue(null);
    expect(shouldShowLadderTagsPrompt(null)).toBe(false);

    vi.mocked(loadPhysicalProfile).mockReturnValue(emptyTagsProfile);
    expect(shouldShowLadderTagsPrompt(null)).toBe(true);
    expect(shouldShowLadderTagsPrompt({ jobCategory: '', countryCode: '' })).toBe(true);

    vi.mocked(safeGetItem).mockImplementation((key) =>
      key === 'up.ladder.tagsPrompt.dismissed.v1' ? '1' : null
    );
    expect(shouldShowLadderTagsPrompt(null)).toBe(false);
  });

  it('suppresses prompt when cloud myEntry already has Job/Country (rehydrate path)', () => {
    vi.mocked(safeGetItem).mockReturnValue(null);
    vi.mocked(loadPhysicalProfile).mockReturnValue(emptyTagsProfile);
    expect(
      shouldShowLadderTagsPrompt({ jobCategory: 'engineering', countryCode: 'TW' })
    ).toBe(false);
  });

  it('keeps filter nudge independent from entry dismiss (strategy B)', () => {
    vi.mocked(loadPhysicalProfile).mockReturnValue(emptyTagsProfile);
    vi.mocked(safeGetItem).mockImplementation((key) =>
      key === 'up.ladder.tagsPrompt.dismissed.v1' ? '1' : null
    );
    expect(shouldShowLadderTagsPrompt(null)).toBe(false);
    expect(shouldShowLadderFilterTagsNudge(null)).toBe(true);

    vi.mocked(safeGetItem).mockImplementation((key) =>
      key === 'up.ladder.filterTagsNudge.dismissed.v1' ? '1' : null
    );
    expect(shouldShowLadderFilterTagsNudge(null)).toBe(false);
  });

  it('suppresses filter nudge once a high-value tag is present locally', () => {
    vi.mocked(safeGetItem).mockReturnValue(null);
    vi.mocked(loadPhysicalProfile).mockReturnValue({
      ...emptyTagsProfile,
      jobCategory: 'engineering',
    });
    expect(shouldShowLadderFilterTagsNudge(null)).toBe(false);
  });

  it('rehydrates Job/Country (+ TW locality) from cloud into empty local profile', () => {
    vi.mocked(safeGetItem).mockReturnValue(null);
    vi.mocked(loadPhysicalProfile).mockReturnValue(emptyTagsProfile);

    const wrote = maybeRehydrateLocalLadderTagsFromCloud({
      jobCategory: 'engineering',
      countryCode: 'TW',
      city: '台北市',
      district: '大安區',
    });

    expect(wrote).toBe(true);
    expect(savePhysicalProfile).toHaveBeenCalledTimes(1);
    const saved = vi.mocked(savePhysicalProfile).mock.calls[0][0];
    expect(saved.jobCategory).toBe('engineering');
    expect(saved.countryCode).toBe('TW');
    expect(saved.city).toBe('台北市');
    expect(saved.district).toBe('大安區');
  });

  it('falls back to Job/Country-only when TW locality is invalid', () => {
    vi.mocked(safeGetItem).mockReturnValue(null);
    vi.mocked(loadPhysicalProfile).mockReturnValue(emptyTagsProfile);

    const wrote = maybeRehydrateLocalLadderTagsFromCloud({
      jobCategory: 'engineering',
      countryCode: 'TW',
      city: 'NotACity',
      district: 'NotADistrict',
    });

    expect(wrote).toBe(true);
    const saved = vi.mocked(savePhysicalProfile).mock.calls[0][0];
    expect(saved.jobCategory).toBe('engineering');
    expect(saved.countryCode).toBe('TW');
    expect(saved.city).toBe('');
    expect(saved.district).toBe('');
  });

  it('does not rehydrate when local already has high-value tags', () => {
    vi.mocked(loadPhysicalProfile).mockReturnValue({
      ...emptyTagsProfile,
      jobCategory: 'student',
    });
    expect(
      maybeRehydrateLocalLadderTagsFromCloud({
        jobCategory: 'engineering',
        countryCode: 'US',
      })
    ).toBe(false);
    expect(savePhysicalProfile).not.toHaveBeenCalled();
  });

  it('does not rehydrate when cloud also lacks Job/Country', () => {
    vi.mocked(loadPhysicalProfile).mockReturnValue(emptyTagsProfile);
    expect(maybeRehydrateLocalLadderTagsFromCloud(null)).toBe(false);
    expect(maybeRehydrateLocalLadderTagsFromCloud({ jobCategory: '', countryCode: '' })).toBe(
      false
    );
    expect(savePhysicalProfile).not.toHaveBeenCalled();
  });

  it('rehydrates even when entry prompt was dismissed', () => {
    vi.mocked(safeGetItem).mockImplementation((key) =>
      key === 'up.ladder.tagsPrompt.dismissed.v1' ? '1' : null
    );
    vi.mocked(loadPhysicalProfile).mockReturnValue(emptyTagsProfile);
    expect(
      maybeRehydrateLocalLadderTagsFromCloud({ jobCategory: '', countryCode: 'JP' })
    ).toBe(true);
    expect(savePhysicalProfile).toHaveBeenCalled();
  });

  it('settleLadderTagsWithCloud covers prompt / rehydrate / none', () => {
    vi.mocked(safeGetItem).mockReturnValue(null);
    vi.mocked(loadPhysicalProfile).mockReturnValue(emptyTagsProfile);

    expect(settleLadderTagsWithCloud(null, { dismissed: false })).toBe('prompt');
    expect(
      settleLadderTagsWithCloud({ jobCategory: 'coach', countryCode: '' }, { dismissed: false })
    ).toBe('rehydrated');
    expect(settleLadderTagsWithCloud(null, { dismissed: true })).toBe('none');

    vi.mocked(loadPhysicalProfile).mockReturnValue({
      ...emptyTagsProfile,
      jobCategory: 'coach',
      countryCode: 'US',
    });
    expect(settleLadderTagsWithCloud(null, { dismissed: false })).toBe('none');
  });
});
