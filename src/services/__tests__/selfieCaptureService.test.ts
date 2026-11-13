import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getPhoto = vi.fn();
const isNativePlatform = vi.fn(() => false);
const convertFileSrc = vi.fn((path: string) => `converted:${path}`);
const readFile = vi.fn();

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
    convertFileSrc: (path: string) => convertFileSrc(path),
  },
}));

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto },
  CameraResultType: { Uri: 'uri', Base64: 'base64' },
  CameraSource: { Camera: 'CAMERA', Photos: 'PHOTOS' },
  CameraDirection: { Front: 'FRONT', Rear: 'REAR' },
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    readFile: (...args: unknown[]) => readFile(...args),
  },
}));

function mockBitmap(width: number, height: number): ImageBitmap {
  return {
    width,
    height,
    close: vi.fn(),
  } as unknown as ImageBitmap;
}

describe('selfieCaptureService', () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    isNativePlatform.mockReturnValue(false);
  });

  afterEach(() => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('decodeControlledImageBitmap keeps images within max edge and resizes oversized ones', async () => {
    const small = mockBitmap(800, 600);
    const large = mockBitmap(4000, 2000);
    const resized = mockBitmap(1920, 960);
    const createImageBitmap = vi
      .fn()
      .mockResolvedValueOnce(small)
      .mockResolvedValueOnce(large)
      .mockResolvedValueOnce(resized);
    globalThis.createImageBitmap = createImageBitmap as typeof globalThis.createImageBitmap;

    const { decodeControlledImageBitmap, SELFIE_MAX_EDGE } = await import(
      '../selfieCaptureService'
    );

    const kept = await decodeControlledImageBitmap(new Blob(['x'], { type: 'image/jpeg' }));
    expect(kept).toBe(small);
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(Blob), {
      imageOrientation: 'from-image',
    });

    const scaled = await decodeControlledImageBitmap(new Blob(['y'], { type: 'image/jpeg' }));
    expect(scaled).toBe(resized);
    expect(createImageBitmap).toHaveBeenCalledWith(large, {
      resizeWidth: SELFIE_MAX_EDGE,
      resizeHeight: 960,
      resizeQuality: 'high',
    });
    expect(large.close).toHaveBeenCalled();
  });

  it('native camera path uses Uri resultType and returns a bitmap', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockResolvedValue({ webPath: 'file:///tmp/selfie.jpg' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['jpeg'], { type: 'image/jpeg' }),
    }) as unknown as typeof fetch;

    const bitmap = mockBitmap(1200, 1600);
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmap) as typeof createImageBitmap;

    const { captureSelfieImage } = await import('../selfieCaptureService');
    const result = await captureSelfieImage({ source: 'camera' });

    expect(getPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'CAMERA',
        resultType: 'uri',
        correctOrientation: true,
        direction: 'FRONT',
      })
    );
    expect(convertFileSrc).toHaveBeenCalledWith('file:///tmp/selfie.jpg');
    expect(result).toEqual({ ok: true, bitmap });
  });

  it('native photos path omits front-camera direction', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockResolvedValue({ webPath: 'file:///tmp/gallery.jpg' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['jpeg'], { type: 'image/jpeg' }),
    }) as unknown as typeof fetch;
    globalThis.createImageBitmap = vi
      .fn()
      .mockResolvedValue(mockBitmap(640, 480)) as typeof createImageBitmap;

    const { captureSelfieImage } = await import('../selfieCaptureService');
    await captureSelfieImage({ source: 'photos' });

    expect(getPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'PHOTOS',
        resultType: 'uri',
      })
    );
    expect(getPhoto.mock.calls[0]?.[0]).not.toHaveProperty('direction');
  });

  it('returns cancelled when the native picker is dismissed', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockRejectedValue(new Error('User cancelled photos app'));

    const { captureSelfieImage } = await import('../selfieCaptureService');
    await expect(captureSelfieImage({ source: 'photos' })).resolves.toEqual({
      ok: false,
      reason: 'cancelled',
    });
  });

  it('web camera path uses capture=user file input and decodes the selected file', async () => {
    const bitmap = mockBitmap(900, 900);
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmap) as typeof createImageBitmap;

    const { captureSelfieImage } = await import('../selfieCaptureService');

    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(function (this: HTMLInputElement) {
        expect(this.accept).toBe('image/*');
        expect(this.getAttribute('capture')).toBe('user');
        const file = new File(['img'], 'selfie.jpg', { type: 'image/jpeg' });
        Object.defineProperty(this, 'files', {
          configurable: true,
          value: {
            0: file,
            length: 1,
            item: (index: number) => (index === 0 ? file : null),
          },
        });
        this.dispatchEvent(new Event('change'));
      });

    const result = await captureSelfieImage({ source: 'camera' });
    expect(result).toEqual({ ok: true, bitmap });
    clickSpy.mockRestore();
  });

  it('web photos path omits capture attribute', async () => {
    globalThis.createImageBitmap = vi
      .fn()
      .mockResolvedValue(mockBitmap(100, 100)) as typeof createImageBitmap;

    const { captureSelfieImage } = await import('../selfieCaptureService');
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(function (this: HTMLInputElement) {
        expect(this.getAttribute('capture')).toBeNull();
        const file = new File(['img'], 'gallery.jpg', { type: 'image/jpeg' });
        Object.defineProperty(this, 'files', {
          configurable: true,
          value: { 0: file, length: 1, item: () => file },
        });
        this.dispatchEvent(new Event('change'));
      });

    await captureSelfieImage({ source: 'photos' });
    clickSpy.mockRestore();
  });

  it('returns cancelled when the web picker is dismissed without a file', async () => {
    vi.useFakeTimers();
    const { captureSelfieImage } = await import('../selfieCaptureService');

    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(() => {
        // Simulate focus only after the deferred cancel listener attaches.
      });

    const pending = captureSelfieImage({ source: 'photos' });
    await vi.advanceTimersByTimeAsync(400);
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(300);
    await expect(pending).resolves.toEqual({ ok: false, reason: 'cancelled' });
    clickSpy.mockRestore();
  });

  it('returns unavailable when native photo has no usable path', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockResolvedValue({});

    const { captureSelfieImage } = await import('../selfieCaptureService');
    await expect(captureSelfieImage({ source: 'camera' })).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('falls back to Filesystem.readFile when webPath fetch fails', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockResolvedValue({
      webPath: 'file:///tmp/selfie.jpg',
      path: '/data/selfie.jpg',
      format: 'jpeg',
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch;
    readFile.mockResolvedValue({ data: btoa('jpeg-bytes') });
    const bitmap = mockBitmap(640, 480);
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmap) as typeof createImageBitmap;

    const { captureSelfieImage } = await import('../selfieCaptureService');
    await expect(captureSelfieImage({ source: 'camera' })).resolves.toEqual({
      ok: true,
      bitmap,
    });
    expect(readFile).toHaveBeenCalledWith({ path: '/data/selfie.jpg' });
  });

  it('returns unavailable for native permission denial (not cancelled)', async () => {
    isNativePlatform.mockReturnValue(true);
    const denied = new Error('Permission denied');
    denied.name = 'NotAllowedError';
    getPhoto.mockRejectedValue(denied);

    const { captureSelfieImage } = await import('../selfieCaptureService');
    await expect(captureSelfieImage({ source: 'camera' })).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('returns decode-failed when createImageBitmap rejects', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockResolvedValue({ webPath: 'file:///tmp/bad.jpg' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['x'], { type: 'image/jpeg' }),
    }) as unknown as typeof fetch;
    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('boom')) as typeof createImageBitmap;

    const { captureSelfieImage } = await import('../selfieCaptureService');
    await expect(captureSelfieImage({ source: 'camera' })).resolves.toEqual({
      ok: false,
      reason: 'decode-failed',
    });
  });
});
