import { describe, expect, it } from 'vitest';
import { resolveLeaderboardUploadHapticPreset } from '../leaderboardUploadHaptic';

describe('resolveLeaderboardUploadHapticPreset', () => {
  it('returns success when score was written', () => {
    expect(resolveLeaderboardUploadHapticPreset({ ok: true, updated: true })).toBe('success');
  });

  it('returns ack for unchanged public score', () => {
    expect(
      resolveLeaderboardUploadHapticPreset({ ok: true, updated: false, reason: 'unchanged' })
    ).toBe('ack');
  });

  it('returns success for avatar-only patch', () => {
    expect(
      resolveLeaderboardUploadHapticPreset({
        ok: true,
        updated: false,
        reason: 'avatar-patched',
      })
    ).toBe('success');
  });

  it('returns warning when rate limited', () => {
    expect(
      resolveLeaderboardUploadHapticPreset({ ok: false, updated: false, reason: 'rate-limited' })
    ).toBe('warning');
  });

  it('returns error for pro-required and unknown failures', () => {
    expect(resolveLeaderboardUploadHapticPreset({ ok: false, reason: 'pro-required' })).toBe(
      'error'
    );
    expect(resolveLeaderboardUploadHapticPreset({ ok: false, reason: 'unknown', updated: false })).toBe(
      'error'
    );
    expect(
      resolveLeaderboardUploadHapticPreset({ ok: false, reason: 'avatar-upload-failed', updated: false })
    ).toBe('error');
  });

  it('returns ack for ok write with no delta when reason omitted', () => {
    expect(resolveLeaderboardUploadHapticPreset({ ok: true, updated: false })).toBe('ack');
  });
});
