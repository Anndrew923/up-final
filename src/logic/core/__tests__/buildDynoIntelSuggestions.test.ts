import { describe, expect, it } from 'vitest';
import { resolveDynoIntelAxisQueryKeyword } from '../dynoIntelAxisQueryKeyword';
import {
  buildDynoIntelSuggestions,
  resolveDynoIntelAxisSuggestionQuery,
} from '../buildDynoIntelSuggestions';

describe('buildDynoIntelSuggestions', () => {
  it('omits axis chip when weakest axis query is unavailable', () => {
    const items = buildDynoIntelSuggestions({
      overallLabel: 'overall',
      overallQuery: 'overall q',
      axisLabel: 'axis',
      axisQuery: null,
      methodologyLabel: 'method',
      methodologyQuery: 'method q',
    });
    expect(items.map((row) => row.id)).toEqual(['overall', 'methodology']);
  });

  it('builds axis query from template and routing keyword', () => {
    const query = resolveDynoIntelAxisSuggestionQuery(
      'gripStrength',
      'How is my {{axisLabel}} performance?',
      resolveDynoIntelAxisQueryKeyword
    );
    expect(query).toBe('How is my grip performance?');
  });
});

describe('resolveDynoIntelAxisQueryKeyword', () => {
  it('maps every six-axis metric to a regex-safe token', () => {
    expect(resolveDynoIntelAxisQueryKeyword('strength')).toBe('strength');
    expect(resolveDynoIntelAxisQueryKeyword('bodyFat')).toBe('FFMI');
    expect(resolveDynoIntelAxisQueryKeyword('muscleMass')).toBe('muscle mass');
  });
});
