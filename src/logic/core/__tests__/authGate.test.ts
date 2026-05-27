import { describe, expect, it } from 'vitest';
import {
  canEnterMainApp,
  shouldForceAuthChoice,
  shouldShowAuthBootstrapFallback,
} from '../authGate';

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
      expect(
        shouldForceAuthChoice({
          isFirebaseReady: true,
          authStatus: 'signed-out',
          isAnonymous: false,
          hasOnboarding: false,
        })
      ).toBe(true);
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
      expect(
        shouldForceAuthChoice({
          isFirebaseReady: true,
          authStatus: 'loading',
          isAnonymous: false,
          hasOnboarding: false,
        })
      ).toBe(false);
    });
  });

  describe('shouldShowAuthBootstrapFallback', () => {
    it('shows fallback while loading without access', () => {
      expect(
        shouldShowAuthBootstrapFallback({
          isFirebaseReady: true,
          authStatus: 'loading',
          isAnonymous: false,
          hasOnboarding: false,
        })
      ).toBe(true);
    });

    it('hides fallback when anonymous session is ready', () => {
      expect(
        shouldShowAuthBootstrapFallback({
          isFirebaseReady: true,
          authStatus: 'signed-in',
          isAnonymous: true,
          hasOnboarding: false,
        })
      ).toBe(false);
    });
  });
});
