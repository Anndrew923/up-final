import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import {
  resolveLeaderboardUploadHapticPreset,
  type LeaderboardUploadHapticInput,
} from '../logic/core/leaderboardUploadHaptic';
import { prefersReducedMotion } from '../lib/motionPreference';

export type HapticPreset = 'ack' | 'selection' | 'milestone' | 'climax' | 'success' | 'warning' | 'error';

export type NavTabSensoryPhase = 'tick' | 'ack';

function fallbackWeb(preset: HapticPreset): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;

  switch (preset) {
    case 'ack':
      navigator.vibrate(15);
      break;
    case 'selection':
      navigator.vibrate(8);
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
    case 'selection':
      await Haptics.selectionChanged();
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

const CONTINUOUS_SOFT_INTERVAL_MS = 80;
let continuousSoftTimer: ReturnType<typeof setInterval> | null = null;
let continuousSoftEndTimer: ReturnType<typeof setTimeout> | null = null;

function clearContinuousSoftTimers(): void {
  if (continuousSoftTimer !== null) {
    clearInterval(continuousSoftTimer);
    continuousSoftTimer = null;
  }
  if (continuousSoftEndTimer !== null) {
    clearTimeout(continuousSoftEndTimer);
    continuousSoftEndTimer = null;
  }
}

async function runContinuousSoftNative(durationMs: number): Promise<void> {
  await Haptics.selectionStart();
  continuousSoftTimer = setInterval(() => {
    void Haptics.selectionChanged();
  }, CONTINUOUS_SOFT_INTERVAL_MS);
  continuousSoftEndTimer = setTimeout(() => {
    clearContinuousSoftTimers();
    void Haptics.selectionEnd();
  }, durationMs);
}

function runContinuousSoftWeb(durationMs: number): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  const pulse = 12;
  const gap = CONTINUOUS_SOFT_INTERVAL_MS - pulse;
  const pattern: number[] = [];
  const count = Math.max(1, Math.ceil(durationMs / CONTINUOUS_SOFT_INTERVAL_MS));
  for (let i = 0; i < count; i += 1) {
    pattern.push(pulse);
    if (i < count - 1) pattern.push(Math.max(0, gap));
  }
  navigator.vibrate(pattern);
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

  /** Charge ceremony — soft selection haptics for the full duration. */
  triggerContinuousSoft(durationMs: number): void {
    if (prefersReducedMotion() || durationMs <= 0) return;
    this.stopContinuousSoft();

    if (Capacitor.isNativePlatform()) {
      void runContinuousSoftNative(durationMs).catch(() => runContinuousSoftWeb(durationMs));
      return;
    }
    runContinuousSoftWeb(durationMs);
  },

  stopContinuousSoft(): void {
    clearContinuousSoftTimers();
    if (Capacitor.isNativePlatform()) {
      void Haptics.selectionEnd().catch(() => undefined);
    }
  },

  /**
   * Bottom-tab PDK tick/ack — exempt from reduced-motion haptic gate (WHY: tactile wayfinding
   * must survive Strategy A visual instant-cut; dopamine + orientation without animation cost).
   */
  async triggerNavTabSensory(phase: NavTabSensoryPhase): Promise<void> {
    const preset: HapticPreset = phase === 'tick' ? 'selection' : 'ack';
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

  /** Breakthrough / rank climax — three-beat success burst. */
  async triggerSuccessBurst(): Promise<void> {
    if (prefersReducedMotion()) return;
    await this.trigger('milestone');
    await waitMs(120);
    await this.trigger('success');
    await waitMs(160);
    await this.trigger('climax');
  },
};
