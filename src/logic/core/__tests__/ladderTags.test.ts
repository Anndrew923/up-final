import { describe, expect, it } from 'vitest';
import {
  countLadderTags,
  hasHighValueLadderTags,
  resolveLadderTagsLocalCloudDecision,
  shouldPromptForLadderTags,
} from '../ladderTags';

describe('countLadderTags', () => {
  it('returns 0 when all optional tags are empty', () => {
    expect(countLadderTags({})).toBe(0);
    expect(
      countLadderTags({
        jobCategory: '',
        weeklyTrainingHours: '',
        trainingYears: null,
        countryCode: '',
        region: '',
      })
    ).toBe(0);
  });

  it('counts job, training, country, and region tags', () => {
    expect(
      countLadderTags({
        jobCategory: 'engineering',
        weeklyTrainingHours: 5,
        trainingYears: '2',
        countryCode: 'US',
        region: 'CA',
      })
    ).toBe(5);
  });

  it('counts TW city/district as the region tag', () => {
    expect(
      countLadderTags({
        countryCode: 'TW',
        city: 'Taipei',
        district: '',
      })
    ).toBe(2);
  });
});

describe('shouldPromptForLadderTags', () => {
  it('is false when permanently dismissed', () => {
    expect(shouldPromptForLadderTags({ jobCategory: '', countryCode: '' }, true)).toBe(false);
  });

  it('is true when both high-value tags are empty', () => {
    expect(shouldPromptForLadderTags({ jobCategory: '', countryCode: '' }, false)).toBe(true);
  });

  it('is false when profile is missing or a high-value tag is already set', () => {
    expect(shouldPromptForLadderTags(null, false)).toBe(false);
    expect(
      shouldPromptForLadderTags({ jobCategory: 'engineering', countryCode: '' }, false)
    ).toBe(false);
    expect(shouldPromptForLadderTags({ jobCategory: '', countryCode: 'TW' }, false)).toBe(false);
  });
});

describe('resolveLadderTagsLocalCloudDecision', () => {
  const empty = { jobCategory: '', countryCode: '' };

  it('prompts only when both local and cloud lack Job/Country', () => {
    expect(resolveLadderTagsLocalCloudDecision(empty, null, false)).toBe('prompt');
    expect(resolveLadderTagsLocalCloudDecision(empty, empty, false)).toBe('prompt');
  });

  it('rehydrates when cloud has Job/Country and local is empty', () => {
    expect(
      resolveLadderTagsLocalCloudDecision(empty, { jobCategory: 'engineering', countryCode: '' }, false)
    ).toBe('rehydrate');
    expect(
      resolveLadderTagsLocalCloudDecision(empty, { jobCategory: '', countryCode: 'TW' }, false)
    ).toBe('rehydrate');
  });

  it('does not prompt after dismiss, but still allows rehydrate', () => {
    expect(resolveLadderTagsLocalCloudDecision(empty, null, true)).toBe('none');
    expect(
      resolveLadderTagsLocalCloudDecision(empty, { jobCategory: 'student', countryCode: 'JP' }, true)
    ).toBe('rehydrate');
  });

  it('returns none when local already has a high-value tag', () => {
    expect(
      resolveLadderTagsLocalCloudDecision(
        { jobCategory: 'engineering', countryCode: '' },
        null,
        false
      )
    ).toBe('none');
    expect(hasHighValueLadderTags({ jobCategory: '', countryCode: 'US' })).toBe(true);
  });
});
