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

  it('bootstrap preloads all cues on web', async () => {
    const { soundService } = await import('../soundService');
    await soundService.bootstrap();
    await soundService.bootstrap();
    expect(Audio).toHaveBeenCalledTimes(4);
  });

  it('play clones web audio node', async () => {
    const { soundService } = await import('../soundService');
    await soundService.bootstrap();
    soundService.play('pdk_shift');
    const entry = vi.mocked(Audio).mock.results[0]?.value as { cloneNode: ReturnType<typeof vi.fn> };
    expect(entry.cloneNode).toHaveBeenCalled();
  });

  it('stopAll pauses active loop cues', async () => {
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
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('skips play when sound disabled', async () => {
    isSoundEnabled.mockReturnValue(false);
    const { soundService, __resetSoundServiceForTests } = await import('../soundService');
    __resetSoundServiceForTests();
    await soundService.bootstrap();
    const callsAfterBootstrap = vi.mocked(Audio).mock.calls.length;
    soundService.play('breakthrough');
    expect(vi.mocked(Audio).mock.calls.length).toBe(callsAfterBootstrap);
    isSoundEnabled.mockReturnValue(true);
  });
});
