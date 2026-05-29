import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KNOWN_LEADERBOARD_SHARD_IDS } from '../ladderShards';

/**
 * WHY: Client sync targets use `ladderShards.ts`; Functions validate against `constants.js`.
 * Drift causes "invalid-input" for every new shard until functions are redeployed.
 */
describe('ladder shard whitelist parity (client vs functions)', () => {
  it('matches functions/shared/constants.js KNOWN_LEADERBOARD_SHARD_IDS', () => {
    const constantsPath = resolve(
      process.cwd(),
      'functions/shared/constants.js'
    );
    const source = readFileSync(constantsPath, 'utf8');
    const match = source.match(/KNOWN_LEADERBOARD_SHARD_IDS = new Set\(\[([\s\S]*?)\]\)/);
    expect(match, 'Could not parse functions KNOWN_LEADERBOARD_SHARD_IDS').not.toBeNull();

    const serverIds = [...match![1].matchAll(/"([^"]+)"/g)].map((m) => m[1]).sort();
    const clientIds = [...KNOWN_LEADERBOARD_SHARD_IDS].sort();

    expect(clientIds).toEqual(serverIds);
  });
});
