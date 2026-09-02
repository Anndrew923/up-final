import { beforeEach, describe, expect, it, vi } from 'vitest';

const getPhoto = vi.fn();
const isNativePlatform = vi.fn(() => false);

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => isNativePlatform() },
}));

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto },
  CameraResultType: { Base64: 'base64' },
  CameraSource: { Photos: 'PHOTOS' },
}));

const expectedGetPhotoOptions = {
  source: 'PHOTOS',
  resultType: 'base64',
  quality: 80,
  width: 800,
  height: 800,
  correctOrientation: true,
};

describe('ladderAvatarPickService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    isNativePlatform.mockReturnValue(false);
  });

  it('returns null on web without invoking Camera', async () => {
    const { pickImageFromPhotoLibrary } = await import('../ladderAvatarPickService');
    await expect(pickImageFromPhotoLibrary()).resolves.toBeNull();
    expect(getPhoto).not.toHaveBeenCalled();
  });

  it('opens photo library directly on native and returns a JPEG File from base64', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockResolvedValue({
      base64String: btoa('jpeg-bytes'),
      format: 'jpeg',
    });

    const { pickImageFromPhotoLibrary } = await import('../ladderAvatarPickService');
    const file = await pickImageFromPhotoLibrary();

    expect(getPhoto).toHaveBeenCalledWith(expectedGetPhotoOptions);
    expect(file).toBeInstanceOf(File);
    expect(file?.name).toBe('avatar.jpg');
    expect(file?.type).toBe('image/jpeg');
    expect(file?.size).toBeGreaterThan(0);
  });

  it('always emits avatar.jpg even when native reports jpg/heic format metadata', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockResolvedValue({
      base64String: btoa('jpeg-bytes'),
      format: 'heic',
    });

    const { pickImageFromPhotoLibrary } = await import('../ladderAvatarPickService');
    const file = await pickImageFromPhotoLibrary();

    expect(file?.name).toBe('avatar.jpg');
    expect(file?.type).toBe('image/jpeg');
  });

  it('returns null when the user cancels the native picker', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockRejectedValue(new Error('User cancelled photos app'));

    const { pickImageFromPhotoLibrary } = await import('../ladderAvatarPickService');
    await expect(pickImageFromPhotoLibrary()).resolves.toBeNull();
  });

  it('returns null when base64 payload is missing', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockResolvedValue({ format: 'jpeg' });

    const { pickImageFromPhotoLibrary } = await import('../ladderAvatarPickService');
    await expect(pickImageFromPhotoLibrary()).resolves.toBeNull();
  });

  it('rethrows non-cancel native failures', async () => {
    isNativePlatform.mockReturnValue(true);
    getPhoto.mockRejectedValue(new Error('Photo library permission denied'));

    const { pickImageFromPhotoLibrary } = await import('../ladderAvatarPickService');
    await expect(pickImageFromPhotoLibrary()).rejects.toThrow('Photo library permission denied');
  });
});
