import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import {
  resolveLeaderboardUploadHapticPreset,
  type LeaderboardUploadHapticInput,
} from '../logic/core/leaderboardUploadHaptic';
import { prefersReducedMotion } from '../lib/motionPreference';

export type HapticPreset = 'ack' | 'milestone' | 'climax' | 'success' | 'warning' | 'error';

function fallbackWeb(preset: HapticPreset): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;

  switch (preset) {
    case 'ack':
      navigator.vibrate(15);
      break;
    case 'milestone':
      navigator.vibrate(40);
      break;
    case 'climax':
      navigator.vibrate([80, 50, 80]);
      break;
    case 'success':
      navigator.vibrate([30, 40, 30]);
      break;
    case 'warning':
      navigator.vibrate([60, 60]);
      break;
    case 'error':
      navigator.vibrate([100, 50, 100]);
      break;
  }
}

async function triggerNative(preset: HapticPreset): Promise<void> {
  switch (preset) {
    case 'ack':
      await Haptics.impact({ style: ImpactStyle.Light });
      break;
    case 'milestone':
      await Haptics.impact({ style: ImpactStyle.Medium });
      break;
    case 'climax':
      await Haptics.impact({ style: ImpactStyle.Heavy });
      break;
    case 'success':
      await Haptics.notification({ type: NotificationType.Success });
      break;
    case 'warning':
      await Haptics.notification({ type: NotificationType.Warning });
      break;
    case 'error':
      await Haptics.notification({ type: NotificationType.Error });
      break;
  }
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export const hapticService = {
  async trigger(preset: HapticPreset): Promise<void> {
    if (prefersReducedMotion()) return;

    if (Capacitor.isNativePlatform()) {
      try {
        await triggerNative(preset);
        return;
      } catch {
        fallbackWeb(preset);
        return;
      }
    }

    fallbackWeb(preset);
  },

  fireLeaderboardUploadResult(result: LeaderboardUploadHapticInput): void {
    const preset = resolveLeaderboardUploadHapticPreset(result);
    if (preset) void this.trigger(preset);
  },

  /** Ladder promotion banner: three-beat combo aligned to legacy rank-up timeline. */
  async triggerRankUpCombo(): Promise<void> {
    if (prefersReducedMotion()) return;
    await this.trigger('milestone');
    await waitMs(120);
    await this.trigger('climax');
    await waitMs(160);
    await this.trigger('success');
  },

  /** Google OAuth linked — single success pulse (skips anonymous guest). */
  triggerGoogleSignInSuccess(user: { isAnonymous: boolean }): void {
    if (user.isAnonymous) return;
    void this.trigger('success');
  },

  /** Native tap on Pro subscribe CTA — light impact before store sheet opens. */
  triggerProPurchaseIntent(): void {
    if (!Capacitor.isNativePlatform()) return;
    void this.trigger('ack');
  },

  /** Pro purchase / sandbox unlock — milestone then success notification. */
  async triggerProPurchaseCelebration(): Promise<void> {
    if (prefersReducedMotion()) return;
    await this.trigger('milestone');
    await waitMs(150);
    await this.trigger('success');
  },
};
