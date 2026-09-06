import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../config/routes';
import {
  isAllowedJoinArenaReturnTo,
  isProSubscribeFunnel,
  joinArenaDescriptionKey,
  joinArenaGateFeature,
  joinArenaPath,
  joinArenaTitleKey,
  parseJoinArenaFrom,
  parseJoinArenaReturnTo,
  resolveJoinArenaReturnTo,
} from '../joinArenaNavigation';
import { resolveJoinArenaPrimaryCtaKey } from '../joinArenaPrimaryCta';

describe('joinArenaNavigation', () => {
  it('parses known from query values', () => {
    expect(parseJoinArenaFrom('?from=ladder')).toBe('ladder');
    expect(parseJoinArenaFrom('?from=backup')).toBe('backup');
    expect(parseJoinArenaFrom('?from=settings')).toBe('settings');
    expect(parseJoinArenaFrom('?from=dyno-intel')).toBe('dyno-intel');
    expect(parseJoinArenaFrom('?from=pro-upsell')).toBe('pro-upsell');
    expect(parseJoinArenaFrom('?from=unknown')).toBeNull();
  });

  it('builds contextual paths with optional allowlisted returnTo', () => {
    expect(joinArenaPath('ladder')).toBe('/join-arena?from=ladder');
    expect(joinArenaPath('backup')).toBe('/join-arena?from=backup');
    const dynoUrl = joinArenaPath('dyno-intel', ROUTES.home);
    expect(dynoUrl.startsWith('/join-arena?')).toBe(true);
    const qs = `?${dynoUrl.split('?')[1]}`;
    expect(parseJoinArenaFrom(qs)).toBe('dyno-intel');
    expect(parseJoinArenaReturnTo(qs)).toBe(ROUTES.home);

    const upsellUrl = joinArenaPath('pro-upsell', ROUTES.home);
    expect(upsellUrl).toContain('from=pro-upsell');
    expect(upsellUrl).toContain(`returnTo=${encodeURIComponent(ROUTES.home)}`);
  });

  it('rejects open-redirect returnTo values', () => {
    expect(isAllowedJoinArenaReturnTo('https://evil.example')).toBe(false);
    expect(parseJoinArenaReturnTo('?returnTo=https://evil.example')).toBeNull();
    expect(parseJoinArenaReturnTo('?returnTo=/not-a-real-route')).toBeNull();
    expect(joinArenaPath('dyno-intel', 'https://evil.example')).toBe(
      '/join-arena?from=dyno-intel'
    );
  });

  it('resolves returnTo with funnel defaults', () => {
    expect(resolveJoinArenaReturnTo('backup', '')).toBe(ROUTES.tools);
    expect(resolveJoinArenaReturnTo('dyno-intel', '')).toBe(ROUTES.home);
    expect(resolveJoinArenaReturnTo('pro-upsell', '')).toBe(ROUTES.home);
    expect(resolveJoinArenaReturnTo('ladder', '')).toBe(ROUTES.ladder);
    expect(
      resolveJoinArenaReturnTo('dyno-intel', `?returnTo=${encodeURIComponent(ROUTES.grip)}`)
    ).toBe(ROUTES.grip);
  });

  it('builds contextual description keys', () => {
    expect(joinArenaDescriptionKey('ladder')).toBe('joinDescriptionFromLadder');
    expect(joinArenaDescriptionKey('backup')).toBe('joinDescriptionFromBackup');
    expect(joinArenaDescriptionKey('dyno-intel')).toBe('joinDescriptionFromDynoIntel');
    expect(joinArenaDescriptionKey('pro-upsell')).toBe('joinDescriptionFromProUpsell');
    expect(joinArenaDescriptionKey('settings')).toBe('joinDescription');
    expect(joinArenaDescriptionKey(null)).toBe('joinDescription');
  });

  it('builds contextual title keys', () => {
    expect(joinArenaTitleKey('pro-upsell')).toBe('joinTitleProUpsell');
    expect(joinArenaTitleKey('dyno-intel')).toBe('joinTitleFromDynoIntel');
    expect(joinArenaTitleKey('ladder')).toBe('joinTitle');
    expect(joinArenaTitleKey('settings')).toBe('joinTitle');
    expect(joinArenaTitleKey(null)).toBe('joinTitle');
  });

  it('maps entry context to UI gate feature keys', () => {
    expect(joinArenaGateFeature('backup')).toBe('cloud-sync');
    expect(joinArenaGateFeature('dyno-intel')).toBe('dyno-intel-full');
    expect(joinArenaGateFeature('pro-upsell')).toBe('dyno-intel-full');
    expect(joinArenaGateFeature('ladder')).toBe('ladder-read');
    expect(joinArenaGateFeature('settings')).toBe('ladder-read');
    expect(joinArenaGateFeature(null)).toBe('ladder-read');
  });

  it('classifies paid Pro subscribe funnels vs ladder entry', () => {
    expect(isProSubscribeFunnel('pro-upsell')).toBe(true);
    expect(isProSubscribeFunnel('backup')).toBe(true);
    expect(isProSubscribeFunnel('dyno-intel')).toBe(true);
    expect(isProSubscribeFunnel('ladder')).toBe(false);
    expect(isProSubscribeFunnel('settings')).toBe(false);
    expect(isProSubscribeFunnel(null)).toBe(false);
  });
});

describe('resolveJoinArenaPrimaryCtaKey', () => {
  it('keeps ladder early-bird free CTA when gate is open', () => {
    expect(
      resolveJoinArenaPrimaryCtaKey({
        from: 'ladder',
        busy: false,
        showPlanPicker: true,
        promoOnlyConvert: false,
        uiGateKind: 'none',
        showAppleSignIn: false,
        isBetaOpen: true,
      })
    ).toBe('betaEnterArena');
  });

  it('forces paid subscribe copy for pro-upsell when plan picker is visible', () => {
    expect(
      resolveJoinArenaPrimaryCtaKey({
        from: 'pro-upsell',
        busy: false,
        showPlanPicker: true,
        promoOnlyConvert: false,
        uiGateKind: 'none',
        showAppleSignIn: false,
        isBetaOpen: true,
      })
    ).toBe('confirmSubscribePro');
  });

  it('uses sign-in-to-subscribe copy for pro-upsell auth gate on Android', () => {
    expect(
      resolveJoinArenaPrimaryCtaKey({
        from: 'pro-upsell',
        busy: false,
        showPlanPicker: false,
        promoOnlyConvert: false,
        uiGateKind: 'auth',
        showAppleSignIn: false,
        isBetaOpen: true,
      })
    ).toBe('signInToSubscribePro');
  });

  it('shows return-home when pro-upsell user already has Pro entitlement', () => {
    expect(
      resolveJoinArenaPrimaryCtaKey({
        from: 'pro-upsell',
        busy: false,
        showPlanPicker: false,
        promoOnlyConvert: false,
        uiGateKind: 'none',
        showAppleSignIn: false,
        isBetaOpen: true,
      })
    ).toBe('returnToHome');
  });
});
