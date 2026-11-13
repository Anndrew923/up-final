import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const isNativePlatform = vi.fn(() => false);
const writeFile = vi.fn();
const deleteFile = vi.fn();
const share = vi.fn();

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: {
    writeFile: (...args: unknown[]) => writeFile(...args),
    deleteFile: (...args: unknown[]) => deleteFile(...args),
  },
}));

vi.mock('@capacitor/share', () => ({
  Share: {
    share: (...args: unknown[]) => share(...args),
  },
}));

describe('telemetryCardShareService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    isNativePlatform.mockReturnValue(false);
    deleteFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('buildTelemetryCardFileName embeds a timestamp', async () => {
    const { buildTelemetryCardFileName } = await import('../telemetryCardShareService');
    expect(buildTelemetryCardFileName(1700000000000)).toBe(
      'ultimate-physique-telemetry-1700000000000.png'
    );
  });

  it('sanitizeTelemetryShareFileName strips path traversal and forces .png', async () => {
    const { sanitizeTelemetryShareFileName } = await import('../telemetryCardShareService');
    expect(sanitizeTelemetryShareFileName('../../etc/passwd')).toBe('passwd.png');
    expect(sanitizeTelemetryShareFileName('card.PNG')).toBe('card.PNG');
    expect(sanitizeTelemetryShareFileName('my card')).toBe('my-card.png');
  });

  it('native path writes Cache PNG and opens Share.share with the file uri', async () => {
    isNativePlatform.mockReturnValue(true);
    writeFile.mockResolvedValue({ uri: 'file:///cache/ultimate-physique-telemetry.png' });
    share.mockResolvedValue({ activityType: 'com.linecorp' });

    const { shareTelemetryCardPng } = await import('../telemetryCardShareService');
    const blob = new Blob(['png-bytes'], { type: 'image/png' });
    const result = await shareTelemetryCardPng({
      blob,
      fileName: 'ultimate-physique-telemetry.png',
      title: 'Telemetry',
    });

    expect(result).toEqual({ ok: true });
    expect(writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'ultimate-physique-telemetry.png',
        directory: 'CACHE',
        data: expect.any(String),
      })
    );
    expect(share).toHaveBeenCalledWith({
      title: 'Telemetry',
      dialogTitle: 'Telemetry',
      files: ['file:///cache/ultimate-physique-telemetry.png'],
    });
    expect(deleteFile).toHaveBeenCalledWith({
      path: 'ultimate-physique-telemetry.png',
      directory: 'CACHE',
    });
  });

  it('native cancel from Share Sheet returns cancelled without throwing', async () => {
    isNativePlatform.mockReturnValue(true);
    writeFile.mockResolvedValue({ uri: 'file:///cache/card.png' });
    share.mockRejectedValue(new Error('Share canceled'));

    const { shareTelemetryCardPng } = await import('../telemetryCardShareService');
    await expect(
      shareTelemetryCardPng({ blob: new Blob(['x'], { type: 'image/png' }), fileName: 'card.png' })
    ).resolves.toEqual({ ok: false, reason: 'cancelled' });
  });

  it('native write failure returns write-failed', async () => {
    isNativePlatform.mockReturnValue(true);
    writeFile.mockRejectedValue(new Error('disk full'));

    const { shareTelemetryCardPng } = await import('../telemetryCardShareService');
    await expect(
      shareTelemetryCardPng({ blob: new Blob(['x'], { type: 'image/png' }), fileName: 'card.png' })
    ).resolves.toEqual({ ok: false, reason: 'write-failed' });
    expect(share).not.toHaveBeenCalled();
  });

  it('web path uses navigator.share when canShare accepts files', async () => {
    const shareFn = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', {
      canShare,
      share: shareFn,
    });

    const { shareTelemetryCardPng } = await import('../telemetryCardShareService');
    const blob = new Blob(['png'], { type: 'image/png' });
    const result = await shareTelemetryCardPng({
      blob,
      fileName: 'card.png',
      title: 'UP',
    });

    expect(result).toEqual({ ok: true });
    expect(canShare).toHaveBeenCalled();
    expect(shareFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'UP',
        files: [expect.any(File)],
      })
    );
  });

  it('web navigator.share AbortError returns cancelled', async () => {
    const abort = new Error('AbortError');
    abort.name = 'AbortError';
    vi.stubGlobal('navigator', {
      canShare: () => true,
      share: vi.fn().mockRejectedValue(abort),
    });

    const { shareTelemetryCardPng } = await import('../telemetryCardShareService');
    await expect(
      shareTelemetryCardPng({ blob: new Blob(['png'], { type: 'image/png' }), fileName: 'card.png' })
    ).resolves.toEqual({ ok: false, reason: 'cancelled' });
  });

  it('web falls back to <a download> and revokes the object URL', async () => {
    vi.stubGlobal('navigator', {
      canShare: () => false,
    });

    const createObjectURL = vi.fn(() => 'blob:telemetry-test');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });

    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          rel: '',
          style: { display: '' },
          click,
          remove,
        } as unknown as HTMLAnchorElement;
      }
      return document.createElement(tag);
    }) as typeof document.createElement);

    const { shareTelemetryCardPng } = await import('../telemetryCardShareService');
    const result = await shareTelemetryCardPng({
      blob: new Blob(['png'], { type: 'image/png' }),
      fileName: 'ultimate-physique-telemetry.png',
    });

    expect(result).toEqual({ ok: true });
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:telemetry-test');

    createElement.mockRestore();
    appendChild.mockRestore();
  });

  it('rejects empty blobs as unavailable', async () => {
    const { shareTelemetryCardPng } = await import('../telemetryCardShareService');
    await expect(
      shareTelemetryCardPng({ blob: new Blob([]), fileName: 'empty.png' })
    ).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });
});
