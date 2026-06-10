import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capacitor-community/native-audio';
import { SOUND_CUES, resolveSoundPublicUrl, type SoundCue } from '../config/soundCatalog';
import { canPlaySound } from '../logic/core/soundGate';
import { prefersReducedMotion } from '../lib/motionPreference';
import { sensoryPreferences } from './sensoryPreferences';

type WebAudioEntry = {
  base: HTMLAudioElement;
};

let bootstrapPromise: Promise<void> | null = null;
const nativePreloaded = new Set<SoundCue>();
const webPool = new Map<SoundCue, WebAudioEntry>();

function shouldPlay(): boolean {
  return canPlaySound(prefersReducedMotion(), sensoryPreferences.isSoundEnabled());
}

function resolveAbsoluteSoundUrl(cue: SoundCue): string {
  if (typeof window === 'undefined') return resolveSoundPublicUrl(cue);
  try {
    return new URL(resolveSoundPublicUrl(cue), window.location.origin).href;
  } catch {
    return resolveSoundPublicUrl(cue);
  }
}

async function preloadNative(cue: SoundCue): Promise<void> {
  if (nativePreloaded.has(cue)) return;
  await NativeAudio.preload({
    assetId: cue,
    assetPath: resolveAbsoluteSoundUrl(cue),
    audioChannelNum: 1,
    isUrl: true,
  });
  nativePreloaded.add(cue);
}

function preloadWeb(cue: SoundCue): void {
  if (webPool.has(cue)) return;
  const audio = new Audio(resolveSoundPublicUrl(cue));
  audio.preload = 'auto';
  audio.load();
  webPool.set(cue, { base: audio });
}

async function playNative(cue: SoundCue, loop: boolean): Promise<void> {
  await preloadNative(cue);
  if (loop) {
    await NativeAudio.loop({ assetId: cue });
    return;
  }
  await NativeAudio.play({ assetId: cue });
}

function playWeb(cue: SoundCue, loop: boolean): void {
  preloadWeb(cue);
  const entry = webPool.get(cue);
  if (!entry) return;

  const node = entry.base.cloneNode(true) as HTMLAudioElement;
  node.loop = loop;
  if (loop) {
    void node.play().catch(() => undefined);
    webPool.set(cue, { base: node });
    return;
  }

  void node.play().catch(() => undefined);
}

async function stopNative(cue: SoundCue): Promise<void> {
  if (!nativePreloaded.has(cue)) return;
  try {
    await NativeAudio.stop({ assetId: cue });
  } catch {
    // already stopped
  }
}

function stopWeb(cue: SoundCue): void {
  const entry = webPool.get(cue);
  if (!entry) return;
  entry.base.pause();
  entry.base.currentTime = 0;
  entry.base.loop = false;
  preloadWeb(cue);
}

export const soundService = {
  /** Idempotent bootstrap — tactical silence: no preload; safe under StrictMode double mount. */
  bootstrap(): Promise<void> {
    if (bootstrapPromise) return bootstrapPromise;

    // Tactical silence (2026-06-09): skip native/web preload — preserves singleton + idempotency only.
    bootstrapPromise = Promise.resolve();

    return bootstrapPromise;
  },

  play(cue: SoundCue): void {
    if (!shouldPlay()) return;

    if (Capacitor.isNativePlatform()) {
      void playNative(cue, false).catch(() => playWeb(cue, false));
      return;
    }
    playWeb(cue, false);
  },

  playLoop(cue: SoundCue): void {
    if (!shouldPlay()) return;

    if (Capacitor.isNativePlatform()) {
      void playNative(cue, true).catch(() => playWeb(cue, true));
      return;
    }
    playWeb(cue, true);
  },

  stop(cue: SoundCue): void {
    if (Capacitor.isNativePlatform()) {
      void stopNative(cue);
    }
    stopWeb(cue);
  },

  stopChargeRitual(): void {
    this.stop('charge_up');
    this.stop('boot_hum');
  },

  /** Immediately silence all cues — e.g. when user disables sound in Settings. */
  stopAll(): void {
    for (const cue of SOUND_CUES) {
      this.stop(cue);
    }
  },
};

/** @internal test hook */
export function __resetSoundServiceForTests(): void {
  bootstrapPromise = null;
  nativePreloaded.clear();
  webPool.clear();
}
