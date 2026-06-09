import { describe, expect, it } from 'vitest';
import { canPlaySound } from '../soundGate';

describe('canPlaySound', () => {
  it('blocks when reduced motion is on', () => {
    expect(canPlaySound(true, true)).toBe(false);
  });

  it('blocks when user disabled sound', () => {
    expect(canPlaySound(false, false)).toBe(false);
  });

  it('allows when both gates pass', () => {
    expect(canPlaySound(false, true)).toBe(true);
  });
});
