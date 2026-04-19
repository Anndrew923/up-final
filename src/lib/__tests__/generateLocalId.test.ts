import { describe, expect, it } from 'vitest';
import { generateLocalId } from '../generateLocalId';

describe('generateLocalId', () => {
  it('returns a non-empty string', () => {
    const id = generateLocalId();
    expect(id.length).toBeGreaterThan(4);
  });

  it('returns unique values in a loop', () => {
    const a = new Set<string>();
    for (let i = 0; i < 20; i += 1) a.add(generateLocalId());
    expect(a.size).toBe(20);
  });
});
