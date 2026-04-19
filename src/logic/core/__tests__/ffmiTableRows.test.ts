import { describe, expect, it } from 'vitest';
import { FFMI_TABLE_FEMALE_ORDER, FFMI_TABLE_MALE_ORDER } from '../ffmiTableRows';

describe('FFMI_TABLE_*_ORDER', () => {
  it('covers every male category suffix once', () => {
    expect(FFMI_TABLE_MALE_ORDER).toHaveLength(7);
    expect(new Set(FFMI_TABLE_MALE_ORDER).size).toBe(7);
  });

  it('covers every female category suffix once', () => {
    expect(FFMI_TABLE_FEMALE_ORDER).toHaveLength(5);
    expect(new Set(FFMI_TABLE_FEMALE_ORDER).size).toBe(5);
  });
});
