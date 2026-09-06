import { describe, expect, it } from 'vitest';
import {
  buildGenesisSeatEarlyFallback,
  buildGenesisSeatEndedSummary,
  parseGenesisSeatPublicSummary,
  resolveGenesisSeatCopySpec,
  ttlMsForGenesisSeatStage,
} from '../genesisSeatSummary';

describe('genesisSeatSummary', () => {
  it('builds early fallback without claimedCount', () => {
    expect(buildGenesisSeatEarlyFallback(2000)).toEqual({
      seatLimit: 2000,
      stage: 'early',
    });
  });

  it('parses growth / closing / ended docs and rejects bad shapes', () => {
    expect(
      parseGenesisSeatPublicSummary({
        seatLimit: 2000,
        stage: 'growth',
        percentBucket: 40,
        updatedAt: '2026-09-06T00:00:00.000Z',
      })
    ).toEqual({
      seatLimit: 2000,
      stage: 'growth',
      percentBucket: 40,
      updatedAt: '2026-09-06T00:00:00.000Z',
    });

    expect(
      parseGenesisSeatPublicSummary({
        seatLimit: 2000,
        stage: 'closing',
        remaining: 120,
      })
    ).toMatchObject({ stage: 'closing', remaining: 120 });

    expect(parseGenesisSeatPublicSummary({ stage: 'ended', seatLimit: 2000 })?.stage).toBe(
      'ended'
    );
    expect(parseGenesisSeatPublicSummary({ stage: 'growth' })).toBeNull();
    expect(parseGenesisSeatPublicSummary({ stage: 'closing', remaining: -1 })).toBeNull();
    expect(parseGenesisSeatPublicSummary({ claimedCount: 500 })).toBeNull();
  });

  it('maps stage TTL and copy specs', () => {
    expect(ttlMsForGenesisSeatStage('early')).toBe(30 * 60 * 1000);
    expect(ttlMsForGenesisSeatStage('growth')).toBe(10 * 60 * 1000);
    expect(ttlMsForGenesisSeatStage('closing')).toBe(90 * 1000);
    expect(resolveGenesisSeatCopySpec({ seatLimit: 2000, stage: 'early' })).toEqual({
      stage: 'early',
      count: 2000,
    });
    expect(
      resolveGenesisSeatCopySpec({ seatLimit: 2000, stage: 'growth', percentBucket: 40 })
    ).toEqual({ stage: 'growth', percent: 40 });
    expect(
      resolveGenesisSeatCopySpec({ seatLimit: 2000, stage: 'closing', remaining: 12 })
    ).toEqual({ stage: 'closing', remaining: 12 });
    expect(resolveGenesisSeatCopySpec({ seatLimit: 2000, stage: 'ended' })).toEqual({
      stage: 'ended',
    });
    expect(buildGenesisSeatEndedSummary().stage).toBe('ended');
  });
});
