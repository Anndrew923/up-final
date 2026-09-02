import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isCapacitorNativePlatform } from '../lib/capacitorPlatform';

/** WHY: Avoid `fetch(webPath)` on iOS — WKWebView + https://localhost URIs fail or trigger unstable network paths. */
function base64ToFile(base64: string): File {
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Error('ladder-avatar-invalid-base64');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], 'avatar.jpg', { type: 'image/jpeg' });
}

function isUserCancelledPick(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /cancel/i.test(msg);
}

/**
 * Native-only photo library picker for ladder avatar.
 * WHY: WKWebView `<input type="file">` shows Take Photo / Library sheet and can crash on camera permission.
 * Web callers should fall back to a hidden file input when this returns `null`.
 */
export async function pickImageFromPhotoLibrary(): Promise<File | null> {
  if (!isCapacitorNativePlatform()) return null;

  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Photos,
      resultType: CameraResultType.Base64,
      quality: 80,
      width: 800,
      height: 800,
      correctOrientation: true,
    });
    if (!photo.base64String) return null;
    return base64ToFile(photo.base64String);
  } catch (err) {
    if (isUserCancelledPick(err)) return null;
    throw err;
  }
}
