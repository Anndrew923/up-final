import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../config/routes';
import { canNavigateHistoryBack, resolveHudBackFallback } from '../hudBackNavigation';

describe('canNavigateHistoryBack', () => {
  it('accepts React Router history idx above zero', () => {
    expect(canNavigateHistoryBack({ idx: 1 })).toBe(true);
    expect(canNavigateHistoryBack({ idx: 3 })).toBe(true);
  });

  it('rejects missing, zero, or non-numeric idx', () => {
    expect(canNavigateHistoryBack(null)).toBe(false);
    expect(canNavigateHistoryBack(undefined)).toBe(false);
    expect(canNavigateHistoryBack({})).toBe(false);
    expect(canNavigateHistoryBack({ idx: 0 })).toBe(false);
  });
});

describe('resolveHudBackFallback', () => {
  it('returns assessment lobby for axis subpages', () => {
    expect(resolveHudBackFallback(ROUTES.strength)).toBe(ROUTES.assessment);
    expect(resolveHudBackFallback(ROUTES.grip)).toBe(ROUTES.assessment);
    expect(resolveHudBackFallback(ROUTES.ffmi)).toBe(ROUTES.assessment);
  });

  it('returns tools deck for calculator subpages', () => {
    expect(resolveHudBackFallback(ROUTES.oneRmCalculator)).toBe(ROUTES.tools);
    expect(resolveHudBackFallback(ROUTES.plateCalculator)).toBe(ROUTES.tools);
    expect(resolveHudBackFallback(ROUTES.somatotypeLab)).toBe(ROUTES.tools);
  });

  it('returns settings for settings-stack pages', () => {
    expect(resolveHudBackFallback(ROUTES.about)).toBe(ROUTES.settings);
    expect(resolveHudBackFallback(ROUTES.contact)).toBe(ROUTES.settings);
    expect(resolveHudBackFallback(ROUTES.privacyPolicy)).toBe(ROUTES.settings);
  });

  it('honors Join Arena allowlisted returnTo when history is empty', () => {
    expect(
      resolveHudBackFallback(ROUTES.joinArena, `?from=dyno-intel&returnTo=${ROUTES.grip}`)
    ).toBe(ROUTES.grip);
  });

  it('defaults remaining subpages to home', () => {
    expect(resolveHudBackFallback(ROUTES.settings)).toBe(ROUTES.home);
    expect(resolveHudBackFallback(ROUTES.leaderboardDebug)).toBe(ROUTES.home);
  });
});
