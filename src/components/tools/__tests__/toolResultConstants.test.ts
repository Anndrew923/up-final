import { describe, expect, it } from 'vitest';
import {
  buildTrainingPercentRows,
  expandPlateBlocks,
  formatToolWeight,
} from '../toolResultConstants';

describe('toolResultConstants', () => {
  it('buildTrainingPercentRows returns empty for invalid 1RM', () => {
    expect(buildTrainingPercentRows(0)).toEqual([]);
    expect(buildTrainingPercentRows(-10)).toEqual([]);
  });

  it('buildTrainingPercentRows scales 1RM to training percentages', () => {
    const rows = buildTrainingPercentRows(100);
    expect(rows).toHaveLength(8);
    expect(rows.find((r) => r.percent === 85)?.weightKg).toBe(85);
    expect(rows.find((r) => r.percent === 60)?.weightKg).toBe(60);
  });

  it('expandPlateBlocks flattens per-side pick counts', () => {
    expect(
      expandPlateBlocks([
        { plateValue: 20, count: 2 },
        { plateValue: 10, count: 1 },
      ])
    ).toEqual([20, 20, 10]);
  });

  it('formatToolWeight trims trailing decimals for whole numbers', () => {
    expect(formatToolWeight(20)).toBe('20');
    expect(formatToolWeight(2.5)).toBe('2.5');
  });
});
