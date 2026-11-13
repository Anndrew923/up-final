import { describe, expect, it } from 'vitest';
import { parseClubDispatchPushData } from '../parseClubDispatchPushData';

describe('parseClubDispatchPushData', () => {
  it('parses a full club dispatch FCM data payload', () => {
    expect(
      parseClubDispatchPushData({
        type: 'club_progress_dispatch',
        route: '/crew?focusUid=u1',
        guildId: 'g1',
        focusUid: 'u1',
        dispatchId: 'd1',
        comment: '破80了',
        metricType: 'muscleMass',
        axisScore: '84.7',
        overallScore: '90.28',
        overallDelta: '0.19',
      })
    ).toEqual({
      type: 'club_progress_dispatch',
      route: '/crew?focusUid=u1',
      guildId: 'g1',
      focusUid: 'u1',
      dispatchId: 'd1',
      comment: '破80了',
      metricType: 'muscleMass',
      axisScore: '84.7',
      overallScore: '90.28',
      overallDelta: '0.19',
    });
  });

  it('treats blank optional fields as null and rejects non-dispatch payloads', () => {
    expect(
      parseClubDispatchPushData({
        type: 'club_progress_dispatch',
        route: '/crew?focusUid=u1',
        guildId: 'g1',
        focusUid: 'u1',
        comment: '   ',
        dispatchId: '',
      })
    ).toEqual({
      type: 'club_progress_dispatch',
      route: '/crew?focusUid=u1',
      guildId: 'g1',
      focusUid: 'u1',
      dispatchId: null,
      comment: null,
      metricType: null,
      axisScore: null,
      overallScore: null,
      overallDelta: null,
    });

    expect(parseClubDispatchPushData({ type: 'other', route: '/crew', focusUid: 'u1' })).toBeNull();
    expect(parseClubDispatchPushData(null)).toBeNull();
    expect(
      parseClubDispatchPushData({
        type: 'club_progress_dispatch',
        route: '/crew',
        guildId: 'g1',
      })
    ).toBeNull();
  });
});
