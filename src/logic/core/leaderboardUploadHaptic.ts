/** Minimal upload outcome shape for haptic mapping (keeps logic free of service imports). */
export interface LeaderboardUploadHapticInput {
  ok: boolean;
  reason?:
    | 'pro-required'
    | 'rate-limited'
    | 'invalid-input'
    | 'unknown'
    | 'unchanged'
    | 'avatar-patched'
    | 'avatar-upload-failed';
  updated?: boolean;
}

export type LeaderboardUploadHapticPreset = 'ack' | 'success' | 'warning' | 'error';

/**
 * Maps ladder upload API outcomes to semantic haptic presets.
 * Returns null when no feedback should fire (e.g. pre-flight gate abort — handled outside I/O).
 */
export function resolveLeaderboardUploadHapticPreset(
  result: LeaderboardUploadHapticInput
): LeaderboardUploadHapticPreset | null {
  if (result.updated) return 'success';
  if (result.reason === 'unchanged') return 'ack';
  if (result.reason === 'avatar-patched') return 'success';
  if (result.reason === 'rate-limited') return 'warning';
  if (!result.ok) return 'error';
  if (
    result.reason === 'pro-required' ||
    result.reason === 'invalid-input' ||
    result.reason === 'unknown' ||
    result.reason === 'avatar-upload-failed'
  ) {
    return 'error';
  }
  if (result.ok && result.updated === false) return 'ack';
  return null;
}
