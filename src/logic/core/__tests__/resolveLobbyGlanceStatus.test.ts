import { describe, expect, it } from 'vitest';
import {
  ASSESSMENT_LOBBY_SIX_AXIS_MAP,
  ASSESSMENT_LOBBY_CARD_KEYS,
} from '../../../config/assessmentLobby';
import { SIX_AXIS_METRICS } from '../../../types/scoring';
import {
  buildLobbyGlanceStatus,
  formatLobbyGlanceValue,
  isLobbyGlanceScorePresent,
  LOBBY_CARD_SCORE_METRIC,
  resolveLobbyCardScoreMetric,
} from '../resolveLobbyGlanceStatus';

describe('resolveLobbyGlanceStatus', () => {
  it('stays parity-locked with assessmentLobby six-axis map + armSize', () => {
    expect(Object.keys(LOBBY_CARD_SCORE_METRIC).sort()).toEqual(
      [...ASSESSMENT_LOBBY_CARD_KEYS].sort()
    );
    for (const [cardKey, metric] of Object.entries(ASSESSMENT_LOBBY_SIX_AXIS_MAP)) {
      expect(resolveLobbyCardScoreMetric(cardKey as keyof typeof ASSESSMENT_LOBBY_SIX_AXIS_MAP)).toBe(
        metric
      );
    }
    expect(resolveLobbyCardScoreMetric('armSize')).toBe('armSize');
  });

  it('formats lobby glance as pure 2dp (no mechanical codes)', () => {
    expect(formatLobbyGlanceValue(91)).toBe('91.00');
    expect(formatLobbyGlanceValue(81.57)).toBe('81.57');
    expect(formatLobbyGlanceValue(84.8)).toBe('84.80');
    expect(formatLobbyGlanceValue(106.36)).toBe('106.36');
  });

  it('treats missing/zero as unset', () => {
    expect(isLobbyGlanceScorePresent(undefined)).toBe(false);
    expect(isLobbyGlanceScorePresent(0)).toBe(false);
    expect(isLobbyGlanceScorePresent(12)).toBe(true);
  });

  it('builds filled glance labels without axis codes', () => {
    expect(buildLobbyGlanceStatus('strength', { strength: 81.57 }, '未測')).toEqual({
      label: '81.57',
      filled: true,
    });
    expect(buildLobbyGlanceStatus('grip', { gripStrength: 91 }, 'Pending')).toEqual({
      label: '91.00',
      filled: true,
    });
    expect(buildLobbyGlanceStatus('armSize', { armSize: 42.5 }, '未測')).toEqual({
      label: '42.50',
      filled: true,
    });
  });

  it('returns empty label when score absent', () => {
    expect(buildLobbyGlanceStatus('cardio', {}, 'Pending')).toEqual({
      label: 'Pending',
      filled: false,
    });
    expect(buildLobbyGlanceStatus('cardio', { cardio: 0 }, '未測')).toEqual({
      label: '未測',
      filled: false,
    });
  });

  it('covers every Core Six metric code path via lobby keys', () => {
    const keys = ['strength', 'grip', 'explosive', 'muscle', 'ffmi', 'cardio'] as const;
    const metrics = keys.map((k) => resolveLobbyCardScoreMetric(k));
    expect(new Set(metrics).size).toBe(SIX_AXIS_METRICS.length);
  });
});
