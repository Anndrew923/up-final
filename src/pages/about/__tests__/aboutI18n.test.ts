import { describe, expect, it } from 'vitest';
import { readAdvisorProfiles, readStringList } from '../aboutI18n';

describe('aboutI18n', () => {
  it('readStringList trims valid strings and rejects non-arrays', () => {
    expect(readStringList('fallback')).toEqual([]);
    expect(readStringList(['  a ', '', 'b', 1, null])).toEqual(['a', 'b']);
  });

  it('readAdvisorProfiles keeps only complete advisor objects', () => {
    const advisors = readAdvisorProfiles([
      {
        name: ' A ',
        role: ' Role ',
        subtitle: '  ',
        bio: ' Bio ',
        highlights: ['  one ', ' two '],
        closing: ' Close ',
      },
      { name: 'Broken', role: 'x', bio: 'y' },
      'not-an-object',
    ]);

    expect(advisors).toEqual([
      {
        name: 'A',
        role: 'Role',
        bio: 'Bio',
        closing: 'Close',
        highlights: ['one', 'two'],
      },
    ]);
  });
});
