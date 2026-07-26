import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: vi.fn(),
  safeSetItem: vi.fn(),
}));

vi.mock('../localStorageService', () => ({
  loadPhysicalProfile: vi.fn(),
}));

import { safeGetItem, safeSetItem } from '../../lib/safeLocalStorage';
import { loadPhysicalProfile } from '../localStorageService';
import {
  dismissFilterTagNudge,
  dismissLadderTagsPrompt,
  hasDismissedFilterTagNudge,
  hasDismissedLadderTagsPrompt,
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

  it('offers entry prompt only when profile exists, tags empty, and entry not dismissed', () => {
    vi.mocked(safeGetItem).mockReturnValue(null);
    vi.mocked(loadPhysicalProfile).mockReturnValue(null);
    expect(shouldShowLadderTagsPrompt()).toBe(false);

    vi.mocked(loadPhysicalProfile).mockReturnValue(emptyTagsProfile);
    expect(shouldShowLadderTagsPrompt()).toBe(true);

    vi.mocked(safeGetItem).mockImplementation((key) =>
      key === 'up.ladder.tagsPrompt.dismissed.v1' ? '1' : null
    );
    expect(shouldShowLadderTagsPrompt()).toBe(false);
  });

  it('keeps filter nudge independent from entry dismiss (strategy B)', () => {
    vi.mocked(loadPhysicalProfile).mockReturnValue(emptyTagsProfile);
    vi.mocked(safeGetItem).mockImplementation((key) =>
      key === 'up.ladder.tagsPrompt.dismissed.v1' ? '1' : null
    );
    expect(shouldShowLadderTagsPrompt()).toBe(false);
    expect(shouldShowLadderFilterTagsNudge()).toBe(true);

    vi.mocked(safeGetItem).mockImplementation((key) =>
      key === 'up.ladder.filterTagsNudge.dismissed.v1' ? '1' : null
    );
    expect(shouldShowLadderFilterTagsNudge()).toBe(false);
  });

  it('suppresses filter nudge once a high-value tag is present', () => {
    vi.mocked(safeGetItem).mockReturnValue(null);
    vi.mocked(loadPhysicalProfile).mockReturnValue({
      ...emptyTagsProfile,
      jobCategory: 'engineering',
    });
    expect(shouldShowLadderFilterTagsNudge()).toBe(false);
  });
});
