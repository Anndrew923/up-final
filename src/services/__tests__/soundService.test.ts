import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const preload = vi.fn().mockResolvedValue(undefined);
const play = vi.fn().mockResolvedValue(undefined);
const loop = vi.fn().mockResolvedValue(undefined);
const stop = vi.fn().mockResolvedValue(undefined);

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@capacitor-community/native-audio', () => ({
  NativeAudio: { preload, play, loop, stop },
}));

vi.mock('../../lib/motionPreference', () => ({
  prefersReducedMotion: () => false,
}));

const isSoundEnabled = vi.fn(() => true);

vi.mock('../sensoryPreferences', () => ({
  sensoryPreferences: {
    isSoundEnabled: () => isSoundEnabled(),
    setSoundEnabled: vi.fn(),
  },
}));

describe('soundService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'Audio',
      vi.fn().mockImplementation(() => ({
        preload: 'auto',
        load: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        cloneNode: vi.fn().mockReturnValue({
          loop: false,
          play: vi.fn().mockResolvedValue(undefined),
          pause: vi.fn(),
          currentTime: 0,
        }),
        currentTime: 0,
        loop: false,
      }))
    );
  });

  afterEach(async () => {
    const { __resetSoundServiceForTests } = await import('../soundService');
    __resetSoundServiceForTests();
  });

  it('bootstrap is a no-op preload (tactical silence) but stays idempotent', async () => {
    const { soundService } = await import('../soundService');
    const first = soundService.bootstrap();
    const second = soundService.bootstrap();
    await first;
    await second;
    expect(first).toBe(second);
    expect(Audio).not.toHaveBeenCalled();
    expect(preload).not.toHaveBeenCalled();
  });

  it('play does not clone web audio while pipeline is silenced', async () => {
    const { soundService } = await import('../soundService');
    await soundService.bootstrap();
    soundService.play('pdk_shift');
    expect(Audio).not.toHaveBeenCalled();
  });

  it('stopAll is safe when no cues were started', async () => {
    const pauseSpy = vi.fn();
    vi.stubGlobal(
      'Audio',
      vi.fn().mockImplementation(() => ({
        preload: 'auto',
        load: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        pause: pauseSpy,
        cloneNode: vi.fn().mockImplementation(() => ({
          loop: false,
          play: vi.fn().mockResolvedValue(undefined),
          pause: pauseSpy,
          currentTime: 0,
        })),
        currentTime: 0,
        loop: false,
      }))
    );
    const { soundService, __resetSoundServiceForTests } = await import('../soundService');
    __resetSoundServiceForTests();
    await soundService.bootstrap();
    soundService.playLoop('boot_hum');
    soundService.stopAll();
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it('play stays no-op regardless of user sound preference', async () => {
    isSoundEnabled.mockReturnValue(true);
    const { soundService, __resetSoundServiceForTests } = await import('../soundService');
    __resetSoundServiceForTests();
    await soundService.bootstrap();
    soundService.play('breakthrough');
    expect(Audio).not.toHaveBeenCalled();
    isSoundEnabled.mockReturnValue(true);
  });
});
