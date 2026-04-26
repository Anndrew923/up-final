import { describe, expect, it } from 'vitest';
import { getDisplayNameMaxLength, resolveDisplayName } from '../identity';

describe('resolveDisplayName', () => {
  it('prefers local ladder display name when set', () => {
    const result = resolveDisplayName({
      firebaseDisplayName: 'Google Pilot',
      email: 'pilot@example.com',
      localDisplayName: 'Arena Name',
    });
    expect(result).toBe('Arena Name');
  });

  it('falls back to firebase then email when local empty', () => {
    const result = resolveDisplayName({
      firebaseDisplayName: '   ',
      email: 'pilot@example.com',
      localDisplayName: '',
    });
    expect(result).toBe('pilot');
  });

  it('uses firebase when local is blank', () => {
    const result = resolveDisplayName({
      firebaseDisplayName: 'Google Pilot',
      email: 'pilot@example.com',
      localDisplayName: '   ',
    });
    expect(result).toBe('Google Pilot');
  });

  it('falls back to local display name when google/email unavailable', () => {
    const result = resolveDisplayName({
      firebaseDisplayName: null,
      email: '',
      localDisplayName: 'Local Name',
    });
    expect(result).toBe('Local Name');
  });

  it('uses default fallback when all sources empty', () => {
    const result = resolveDisplayName({});
    expect(result).toBe('未命名用戶');
  });

  it('enforces max display-name length', () => {
    const input = 'abcdefghijklmnopqrstuvwxyz';
    const result = resolveDisplayName({
      firebaseDisplayName: input,
    });
    expect(result).toHaveLength(getDisplayNameMaxLength());
    expect(result).toBe(input.slice(0, getDisplayNameMaxLength()));
  });
});
