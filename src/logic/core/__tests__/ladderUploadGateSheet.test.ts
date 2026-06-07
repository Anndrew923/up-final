import { describe, expect, it } from 'vitest';
import { shouldOpenLadderUploadGateSheet } from '../ladderUploadGateSheet';

describe('shouldOpenLadderUploadGateSheet', () => {
  it('opens when gate is blocked and sheet kind exists', () => {
    expect(shouldOpenLadderUploadGateSheet('pro', 'pro')).toBe(true);
    expect(shouldOpenLadderUploadGateSheet('auth', 'auth')).toBe(true);
  });

  it('does not open when gate is ok', () => {
    expect(shouldOpenLadderUploadGateSheet('ok', 'pro')).toBe(false);
  });

  it('does not open when no sheet kind', () => {
    expect(shouldOpenLadderUploadGateSheet('pro', null)).toBe(false);
    expect(shouldOpenLadderUploadGateSheet('no-score', null)).toBe(false);
  });
});
