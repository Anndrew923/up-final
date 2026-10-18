import { describe, expect, it } from 'vitest';
import { resolveShowRadarPkToggle } from '../useRadarPkToggle';

describe('resolveShowRadarPkToggle', () => {
  it('hides when closed, self, or no local baseline', () => {
    expect(
      resolveShowRadarPkToggle({ open: false, isSelf: false, canCompare: true })
    ).toBe(false);
    expect(
      resolveShowRadarPkToggle({ open: true, isSelf: true, canCompare: true })
    ).toBe(false);
    expect(
      resolveShowRadarPkToggle({ open: true, isSelf: false, canCompare: false })
    ).toBe(false);
  });

  it('shows for other members when local compare baseline exists', () => {
    expect(
      resolveShowRadarPkToggle({ open: true, isSelf: false, canCompare: true })
    ).toBe(true);
  });
});
