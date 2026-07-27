import { describe, expect, it } from 'vitest';
import {
  canEnterMainApp,
  canMountAppShell,
  shouldForceAuthChoice,
  shouldHoldAuthBootstrapSplash,
} from '../authGate';

const coldStart = {
  isFirebaseReady: true,
  authStatus: 'loading' as const,
  isAnonymous: false,
  hasOnboarding: false,
};

const settledSignedOut = {
  ...coldStart,
  authStatus: 'signed-out' as const,
};

describe('authGate', () => {
  describe('canEnterMainApp', () => {
    it('allows Google signed-in users', () => {
      expect(
        canEnterMainApp({ authStatus: 'signed-in', isAnonymous: false, hasOnboarding: false })
      ).toBe(true);
    });

    it('allows anonymous signed-in users without onboarding flag', () => {
      expect(
        canEnterMainApp({ authStatus: 'signed-in', isAnonymous: true, hasOnboarding: false })
      ).toBe(true);
    });

    it('allows signed-out users who completed onboarding', () => {
      expect(
        canEnterMainApp({ authStatus: 'signed-out', isAnonymous: false, hasOnboarding: true })
      ).toBe(true);
    });

    it('blocks signed-out users without onboarding', () => {
      expect(
        canEnterMainApp({ authStatus: 'signed-out', isAnonymous: false, hasOnboarding: false })
      ).toBe(false);
    });

    it('blocks loading users without onboarding', () => {
      expect(
        canEnterMainApp({ authStatus: 'loading', isAnonymous: false, hasOnboarding: false })
      ).toBe(false);
    });
  });

  describe('shouldForceAuthChoice', () => {
    it('forces auth when Firebase ready, settled signed-out, no access', () => {
      expect(shouldForceAuthChoice(settledSignedOut)).toBe(true);
    });

    it('does not force auth for anonymous signed-in', () => {
      expect(
        shouldForceAuthChoice({
          isFirebaseReady: true,
          authStatus: 'signed-in',
          isAnonymous: true,
          hasOnboarding: false,
        })
      ).toBe(false);
    });

    it('does not force auth while loading', () => {
      expect(shouldForceAuthChoice(coldStart)).toBe(false);
    });
  });

  describe('shouldHoldAuthBootstrapSplash', () => {
    it('holds pure splash while loading without access (cold start)', () => {
      expect(shouldHoldAuthBootstrapSplash(coldStart)).toBe(true);
    });

    it('releases splash once auth settles to signed-out (hand off to AuthChoice)', () => {
      expect(shouldHoldAuthBootstrapSplash(settledSignedOut)).toBe(false);
    });

    it('does not hold splash when returning user has onboarding during loading', () => {
      expect(
        shouldHoldAuthBootstrapSplash({
          ...coldStart,
          hasOnboarding: true,
        })
      ).toBe(false);
    });

    it('hides splash when anonymous session is ready', () => {
      expect(
        shouldHoldAuthBootstrapSplash({
          isFirebaseReady: true,
          authStatus: 'signed-in',
          isAnonymous: true,
          hasOnboarding: false,
        })
      ).toBe(false);
    });
  });

  describe('canMountAppShell (hard render gate)', () => {
    it('forbids AppShell during cold-start loading splash', () => {
      expect(canMountAppShell(coldStart)).toBe(false);
      expect(shouldHoldAuthBootstrapSplash(coldStart)).toBe(true);
      expect(shouldForceAuthChoice(coldStart)).toBe(false);
    });

    it('forbids AppShell while forced AuthChoice is active', () => {
      expect(canMountAppShell(settledSignedOut)).toBe(false);
      expect(shouldHoldAuthBootstrapSplash(settledSignedOut)).toBe(false);
      expect(shouldForceAuthChoice(settledSignedOut)).toBe(true);
    });

    it('allows AppShell after anonymous sign-in (unveil main UI)', () => {
      expect(
        canMountAppShell({
          isFirebaseReady: true,
          authStatus: 'signed-in',
          isAnonymous: true,
          hasOnboarding: false,
        })
      ).toBe(true);
    });

    it('allows AppShell for returning users with onboarding even while auth loading', () => {
      expect(
        canMountAppShell({
          isFirebaseReady: true,
          authStatus: 'loading',
          isAnonymous: false,
          hasOnboarding: true,
        })
      ).toBe(true);
    });

    it('cold-start sequence never mounts shell before AuthChoice or access', () => {
      // loading → splash only
      expect(canMountAppShell(coldStart)).toBe(false);
      // settled signed-out → AuthChoice only
      expect(canMountAppShell(settledSignedOut)).toBe(false);
      // after guest/google → shell
      expect(
        canMountAppShell({
          isFirebaseReady: true,
          authStatus: 'signed-in',
          isAnonymous: true,
          hasOnboarding: true,
        })
      ).toBe(true);
    });
  });
});
