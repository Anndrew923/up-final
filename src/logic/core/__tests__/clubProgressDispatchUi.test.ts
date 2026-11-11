import { describe, expect, it } from 'vitest';
import {
  CLUB_DISPATCH_COMMENT_MAX_LEN,
  clampDispatchComment,
  finalizeDispatchComment,
  hasBreakthroughDualSyncFloor,
  resolveBroadcastMetricFromBreakthrough,
  shouldOfferClubDispatchFlow,
} from '../clubProgressDispatchUi';

describe('clampDispatchComment (live)', () => {
  it('keeps mid-word spaces typable (no trim on keystroke)', () => {
    expect(clampDispatchComment('hi ')).toBe('hi ');
    expect(clampDispatchComment('hi  <x>')).toBe('hi  x');
  });

  it('truncates to max length', () => {
    const long = '一二三四五六七八九十一二三四五六七八九十一二三四五';
    expect(clampDispatchComment(long).length).toBe(CLUB_DISPATCH_COMMENT_MAX_LEN);
  });
});

describe('finalizeDispatchComment (submit)', () => {
  it('trims and collapses whitespace like server', () => {
    expect(finalizeDispatchComment('  hi   <x>  ')).toBe('hi x');
  });
});

describe('resolveBroadcastMetricFromBreakthrough', () => {
  it('maps six-axis metrics through', () => {
    expect(resolveBroadcastMetricFromBreakthrough('gripStrength')).toBe('gripStrength');
    expect(resolveBroadcastMetricFromBreakthrough('strength')).toBe('strength');
  });

  it('maps specialty metrics to overall', () => {
    expect(resolveBroadcastMetricFromBreakthrough('armSize')).toBe('overall');
    expect(resolveBroadcastMetricFromBreakthrough('cooper')).toBe('overall');
  });
});

describe('shouldOfferClubDispatchFlow', () => {
  it('only offers for dual membership', () => {
    expect(shouldOfferClubDispatchFlow('dual')).toBe(true);
    expect(shouldOfferClubDispatchFlow('global-only')).toBe(false);
    expect(shouldOfferClubDispatchFlow('pending')).toBe(false);
  });
});

describe('hasBreakthroughDualSyncFloor', () => {
  it('passes when club score or arena targets exist', () => {
    expect(hasBreakthroughDualSyncFloor(88, 0)).toBe(true);
    expect(hasBreakthroughDualSyncFloor(0, 1)).toBe(true);
    expect(hasBreakthroughDualSyncFloor(88, 2)).toBe(true);
  });

  it('rejects empty dual floor', () => {
    expect(hasBreakthroughDualSyncFloor(0, 0)).toBe(false);
    expect(hasBreakthroughDualSyncFloor(-1, 0)).toBe(false);
  });
});
