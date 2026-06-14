import { beforeEach, describe, expect, it, vi } from 'vitest';

const impact = vi.fn().mockResolvedValue(undefined);
const notification = vi.fn().mockResolvedValue(undefined);
const isNativePlatform = vi.fn(() => false);

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => isNativePlatform() },
}));

const selectionStart = vi.fn().mockResolvedValue(undefined);
const selectionChanged = vi.fn().mockResolvedValue(undefined);
const selectionEnd = vi.fn().mockResolvedValue(undefined);

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact, notification, selectionStart, selectionChanged, selectionEnd },
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' },
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}));

vi.mock('../../lib/motionPreference', () => ({
  prefersReducedMotion: vi.fn(() => false),
}));

describe('hapticService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    isNativePlatform.mockReturnValue(false);
    vi.stubGlobal('navigator', { vibrate: vi.fn() });
    const motion = await import('../../lib/motionPreference');
    vi.mocked(motion.prefersReducedMotion).mockReturnValue(false);
  });

  it('uses web vibrate fallback on non-native platforms', async () => {
    const { hapticService } = await import('../hapticService');
    await hapticService.trigger('ack');
    expect(navigator.vibrate).toHaveBeenCalledWith(15);
    expect(impact).not.toHaveBeenCalled();
  });

  it('uses native impact on Capacitor shell', async () => {
    isNativePlatform.mockReturnValue(true);
    const { hapticService } = await import('../hapticService');
    await hapticService.trigger('milestone');
    expect(impact).toHaveBeenCalledWith({ style: 'MEDIUM' });
  });

  it('maps ladder upload success to notification on native', async () => {
    isNativePlatform.mockReturnValue(true);
    const { hapticService } = await import('../hapticService');
    hapticService.fireLeaderboardUploadResult({ ok: true, updated: true });
    await vi.waitFor(() => {
      expect(notification).toHaveBeenCalledWith({ type: 'SUCCESS' });
    });
  });

  it('skips all output when reduced motion is enabled', async () => {
    const motion = await import('../../lib/motionPreference');
    vi.mocked(motion.prefersReducedMotion).mockReturnValue(true);
    const { hapticService } = await import('../hapticService');
    await hapticService.trigger('climax');
    expect(navigator.vibrate).not.toHaveBeenCalled();
    expect(impact).not.toHaveBeenCalled();
  });

  it('keeps nav tab tick/ack haptics when reduced motion is enabled', async () => {
    const motion = await import('../../lib/motionPreference');
    vi.mocked(motion.prefersReducedMotion).mockReturnValue(true);
    const { hapticService } = await import('../hapticService');
    await hapticService.triggerNavTabSensory('tick');
    expect(navigator.vibrate).toHaveBeenCalledWith(8);
    await hapticService.triggerNavTabSensory('ack');
    expect(navigator.vibrate).toHaveBeenCalledWith(15);
  });

  it('skips google sign-in haptic for anonymous users', async () => {
    const { hapticService } = await import('../hapticService');
    hapticService.triggerGoogleSignInSuccess({ isAnonymous: true });
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it('runs selection haptics for continuous soft on native', async () => {
    vi.useFakeTimers();
    isNativePlatform.mockReturnValue(true);
    vi.resetModules();
    const { hapticService } = await import('../hapticService');
    hapticService.triggerContinuousSoft(200);
    await Promise.resolve();
    expect(selectionStart).toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(selectionEnd).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('stopContinuousSoft ends native selection session', async () => {
    isNativePlatform.mockReturnValue(true);
    vi.resetModules();
    const { hapticService } = await import('../hapticService');
    hapticService.triggerContinuousSoft(5000);
    await Promise.resolve();
    expect(selectionStart).toHaveBeenCalled();
    hapticService.stopContinuousSoft();
    expect(selectionEnd).toHaveBeenCalled();
  });
});
