import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetClubDispatchTapCacheForTests,
  clearClubDispatchTapCache,
  consumeClubDispatchTapCache,
  peekClubDispatchTapCache,
  setClubDispatchTapCache,
  stashClubDispatchPushTap,
} from '../clubDispatchTapCache';

describe('clubDispatchTapCache', () => {
  beforeEach(() => {
    __resetClubDispatchTapCacheForTests();
  });

  it('stores a single pending comment and consumes once by focusUid', () => {
    setClubDispatchTapCache({
      focusUid: 'u2',
      dispatchId: 'd1',
      comment: '肌肌長大了',
    });

    expect(peekClubDispatchTapCache()?.comment).toBe('肌肌長大了');
    expect(consumeClubDispatchTapCache({ focusUid: 'u1' })).toBeNull();
    const hit = consumeClubDispatchTapCache({ focusUid: 'u2' });
    expect(hit?.comment).toBe('肌肌長大了');
    expect(hit?.dispatchId).toBe('d1');
    expect(consumeClubDispatchTapCache({ focusUid: 'u2' })).toBeNull();
    expect(peekClubDispatchTapCache()).toBeNull();
  });

  it('clears pending when a club dispatch tap has no comment', () => {
    stashClubDispatchPushTap({
      type: 'club_progress_dispatch',
      route: '/crew?focusUid=u2',
      guildId: 'g1',
      focusUid: 'u2',
      dispatchId: 'd8',
      comment: 'old',
      metricType: 'overall',
      axisScore: null,
      overallScore: '90',
      overallDelta: '1',
    });
    expect(peekClubDispatchTapCache()?.comment).toBe('old');

    stashClubDispatchPushTap({
      type: 'club_progress_dispatch',
      route: '/crew?focusUid=u2',
      guildId: 'g1',
      focusUid: 'u2',
      dispatchId: 'd9',
      comment: null,
      metricType: 'overall',
      axisScore: null,
      overallScore: '90',
      overallDelta: '1',
    });
    expect(peekClubDispatchTapCache()).toBeNull();

    stashClubDispatchPushTap({
      type: 'club_progress_dispatch',
      route: '/crew?focusUid=u2',
      guildId: 'g1',
      focusUid: 'u2',
      dispatchId: 'd9',
      comment: 'go',
      metricType: 'overall',
      axisScore: null,
      overallScore: '90',
      overallDelta: '1',
    });
    expect(consumeClubDispatchTapCache({ dispatchId: 'd9' })?.comment).toBe('go');
    clearClubDispatchTapCache();
    expect(peekClubDispatchTapCache()).toBeNull();
  });
});
