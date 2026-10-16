import { describe, expect, it } from 'vitest';
import {
  GUILD_SYNC_TAP_DEBOUNCE_MS,
  isGuildSyncTapBlocked,
} from '../guildSyncDebounce';

describe('isGuildSyncTapBlocked', () => {
  it('allows the first tap', () => {
    expect(isGuildSyncTapBlocked(null, 10_000)).toBe(false);
  });

  it('blocks within the debounce window', () => {
    expect(isGuildSyncTapBlocked(10_000, 10_000 + GUILD_SYNC_TAP_DEBOUNCE_MS - 1)).toBe(
      true
    );
  });

  it('allows after the debounce window', () => {
    expect(isGuildSyncTapBlocked(10_000, 10_000 + GUILD_SYNC_TAP_DEBOUNCE_MS)).toBe(false);
  });
});
