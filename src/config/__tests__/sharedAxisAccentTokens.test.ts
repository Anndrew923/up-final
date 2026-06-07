import { describe, expect, it } from 'vitest';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import {
  ASSESSMENT_LOBBY_CARD_KEYS,
  ASSESSMENT_LOBBY_SIX_AXIS_MAP,
  ASSESSMENT_LOBBY_STATUS_BAR_CLASS,
} from '../assessmentLobby';
import {
  buildDiagnosticScanAccentStyles,
  getSixAxisAccentRgb,
  getSixAxisLobbyStatusBarClass,
  getSixAxisRadarPalette,
  SIX_AXIS_ACCENT_TOKENS,
} from '../sharedAxisAccentTokens';
import { getRadarPalette } from '../../components/radar/radarVisualTokens';

describe('sharedAxisAccentTokens', () => {
  it.each(SIX_AXIS_METRICS)('%s lobby status bar stroke matches radar palette stroke', (metric) => {
    const token = SIX_AXIS_ACCENT_TOKENS[metric];
    const radar = getSixAxisRadarPalette(metric);
    const fromGetRadar = getRadarPalette(metric);
    const rgb = getSixAxisAccentRgb(metric);

    expect(token.stroke).toBe(radar.stroke);
    expect(fromGetRadar.stroke).toBe(token.stroke);
    expect(getSixAxisLobbyStatusBarClass(metric)).toContain(token.lobbyBgClass);
    expect(getSixAxisLobbyStatusBarClass(metric)).toContain(token.lobbyGlowRgba);
    expect(token.lobbyGlowRgba).toBe(`rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`);
    expect(radar.glow).toBe(`rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`);
  });

  it('assigns unique lobby bg classes across Core Six', () => {
    const bgClasses = SIX_AXIS_METRICS.map((m) => SIX_AXIS_ACCENT_TOKENS[m].lobbyBgClass);
    expect(new Set(bgClasses).size).toBe(SIX_AXIS_METRICS.length);
  });

  it('assigns unique lobby bg classes across all seven dyno cards including armSize', () => {
    const bgClasses = ASSESSMENT_LOBBY_CARD_KEYS.map(
      (key) => ASSESSMENT_LOBBY_STATUS_BAR_CLASS[key].split(' ')[0]
    );
    expect(new Set(bgClasses).size).toBe(ASSESSMENT_LOBBY_CARD_KEYS.length);
  });

  it('armSize lobby uses tactical slate, not muscleMass fuchsia', () => {
    expect(ASSESSMENT_LOBBY_STATUS_BAR_CLASS.armSize).toContain('bg-slate-400');
    expect(ASSESSMENT_LOBBY_STATUS_BAR_CLASS.armSize).not.toContain('fuchsia');
    expect(ASSESSMENT_LOBBY_STATUS_BAR_CLASS.muscle).toContain('bg-fuchsia-500');
  });

  it.each(Object.entries(ASSESSMENT_LOBBY_SIX_AXIS_MAP))(
    'assessment lobby %s routes through shared tokens for %s',
    (cardKey, metric) => {
      expect(ASSESSMENT_LOBBY_STATUS_BAR_CLASS[cardKey as keyof typeof ASSESSMENT_LOBBY_SIX_AXIS_MAP]).toBe(
        getSixAxisLobbyStatusBarClass(metric)
      );
    }
  );

  it.each(Object.entries(ASSESSMENT_LOBBY_SIX_AXIS_MAP))(
    'diagnostic scan overlay for %s uses the same rgb as lobby axis %s',
    (cardKey, metric) => {
      const rgb = getSixAxisAccentRgb(metric);
      const styles = buildDiagnosticScanAccentStyles(rgb);
      expect(styles.textColor).toBe(`rgb(${rgb.r},${rgb.g},${rgb.b})`);
      expect(styles.grid).toContain(`${rgb.r},${rgb.g},${rgb.b}`);
      expect(ASSESSMENT_LOBBY_STATUS_BAR_CLASS[cardKey as keyof typeof ASSESSMENT_LOBBY_SIX_AXIS_MAP]).toContain(
        SIX_AXIS_ACCENT_TOKENS[metric].lobbyBgClass
      );
    }
  );
});
