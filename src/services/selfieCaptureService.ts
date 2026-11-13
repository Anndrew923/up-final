/**
 * Telemetry selfie / photo picker — isolated from ladder avatar I/O.
 *
 * WHY: Ladder avatar uses Base64 + 800² for Firestore payloads. Battle-report
 * plates need Uri → ImageBitmap at ≤1920 so share compose never shares that
 * memory profile or mutates the avatar service.
 */
import {
  Camera,
  CameraDirection,
  CameraResultType,
  CameraSource,
  type Photo,
} from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { isCapacitorNativePlatform } from '../lib/capacitorPlatform';
import { isUserCancelledAction } from '../lib/isUserCancelledAction';

export const SELFIE_MAX_EDGE = 1920;

/** Delay before listening for window focus cancel — opening the picker can steal focus first. */
const WEB_PICKER_CANCEL_FOCUS_DELAY_MS = 400;
const WEB_PICKER_CANCEL_SETTLE_MS = 300;

export type SelfieCaptureSource = 'camera' | 'photos';

export type SelfieCaptureFailReason = 'cancelled' | 'unavailable' | 'decode-failed';

export type SelfieCaptureResult =
  | { ok: true; bitmap: ImageBitmap }
  | { ok: false; reason: SelfieCaptureFailReason };

type NativePickResult =
  | { status: 'ok'; blob: Blob }
  | { status: 'cancelled' }
  | { status: 'failed' };

/**
 * Decode any image source into an ImageBitmap capped at `SELFIE_MAX_EDGE`.
 * Prefers `imageOrientation: 'from-image'` so phone portrait EXIF lands upright;
 * falls back when the runtime rejects that option.
 */
export async function decodeControlledImageBitmap(
  source: ImageBitmapSource,
  maxEdge: number = SELFIE_MAX_EDGE
): Promise<ImageBitmap> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  } catch {
    bitmap = await createImageBitmap(source);
  }

  const width = bitmap.width;
  const height = bitmap.height;
  if (!(width > 0) || !(height > 0)) {
    bitmap.close();
    throw new Error('selfie-empty-image');
  }

  const longest = Math.max(width, height);
  if (longest <= maxEdge) return bitmap;

  const scale = maxEdge / longest;
  const resizeWidth = Math.max(1, Math.round(width * scale));
  const resizeHeight = Math.max(1, Math.round(height * scale));

  try {
    const resized = await createImageBitmap(bitmap, {
      resizeWidth,
      resizeHeight,
      resizeQuality: 'high',
    });
    bitmap.close();
    return resized;
  } catch {
    // Older engines may reject resize options — canvas downsample keeps the contract.
    if (typeof document === 'undefined') {
      bitmap.close();
      throw new Error('selfie-resize-unavailable');
    }
    const canvas = document.createElement('canvas');
    canvas.width = resizeWidth;
    canvas.height = resizeHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      throw new Error('selfie-no-canvas-ctx');
    }
    ctx.drawImage(bitmap, 0, 0, resizeWidth, resizeHeight);
    bitmap.close();
    return createImageBitmap(canvas);
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

async function blobFromNativeWebPath(webPath: string): Promise<Blob> {
  // convertFileSrc remaps file:// / capacitor paths so WKWebView can fetch them.
  const src = Capacitor.convertFileSrc(webPath);
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`selfie-fetch-failed:${response.status}`);
  }
  return response.blob();
}

/**
 * Prefer webPath fetch (keeps Uri memory profile). Fall back to Filesystem.readFile
 * when WKWebView cannot fetch the converted URL — same failure mode ladder avatar avoided
 * by using Base64, without pulling the whole image across the bridge up front.
 */
async function blobFromNativePhoto(photo: Photo): Promise<Blob> {
  if (photo.webPath) {
    try {
      return await blobFromNativeWebPath(photo.webPath);
    } catch {
      // Fall through to path / Filesystem.
    }
  }

  if (!photo.path) {
    throw new Error('selfie-native-path-missing');
  }

  const read = await Filesystem.readFile({ path: photo.path });
  const data = read.data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return data;
  }
  if (typeof data !== 'string' || !data) {
    throw new Error('selfie-native-read-empty');
  }
  const mime = photo.format === 'png' ? 'image/png' : 'image/jpeg';
  // Capacitor may return a data URL or raw base64 depending on platform / version.
  const comma = data.indexOf(',');
  const base64 = comma >= 0 && data.slice(0, comma).includes('base64') ? data.slice(comma + 1) : data;
  return base64ToBlob(base64, mime);
}

async function pickNativePhoto(source: SelfieCaptureSource): Promise<NativePickResult> {
  try {
    const photo = await Camera.getPhoto({
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      resultType: CameraResultType.Uri,
      quality: 92,
      correctOrientation: true,
      ...(source === 'camera' ? { direction: CameraDirection.Front } : {}),
    });
    if (!photo.webPath && !photo.path) {
      return { status: 'failed' };
    }
    const blob = await blobFromNativePhoto(photo);
    return { status: 'ok', blob };
  } catch (err) {
    if (isUserCancelledAction(err)) return { status: 'cancelled' };
    throw err;
  }
}

/**
 * Web file picker. Camera source adds `capture="user"` so mobile browsers open the front camera when available.
 * Cancel (dismiss without a file) resolves null — never rejects.
 */
export function pickWebImageFile(source: SelfieCaptureSource): Promise<File | null> {
  if (typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') {
      input.setAttribute('capture', 'user');
    }
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.tabIndex = -1;

    let settled = false;
    let focusListenTimer = 0;

    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(focusListenTimer);
      window.removeEventListener('focus', onWindowFocus);
      input.remove();
      resolve(file);
    };

    const onWindowFocus = () => {
      // WHY: Dismissing the OS picker often skips `change`; a focus tick later means cancel.
      window.setTimeout(() => {
        if (!settled) finish(null);
      }, WEB_PICKER_CANCEL_SETTLE_MS);
    };

    input.addEventListener('change', () => {
      finish(input.files?.[0] ?? null);
    });

    document.body.appendChild(input);
    input.click();
    // WHY: Some browsers fire window focus when the picker opens — defer cancel listen.
    focusListenTimer = window.setTimeout(() => {
      if (!settled) window.addEventListener('focus', onWindowFocus);
    }, WEB_PICKER_CANCEL_FOCUS_DELAY_MS);
  });
}

/**
 * Capture or pick a photo and return a controlled ImageBitmap for telemetry compose.
 * User cancel → `{ ok: false, reason: 'cancelled' }` (never throws for cancel).
 */
export async function captureSelfieImage(options: {
  source: SelfieCaptureSource;
}): Promise<SelfieCaptureResult> {
  const { source } = options;

  try {
    let blob: Blob | null = null;

    if (isCapacitorNativePlatform()) {
      const picked = await pickNativePhoto(source);
      if (picked.status === 'cancelled') return { ok: false, reason: 'cancelled' };
      if (picked.status === 'failed') return { ok: false, reason: 'unavailable' };
      blob = picked.blob;
    } else {
      const file = await pickWebImageFile(source);
      if (!file) return { ok: false, reason: 'cancelled' };
      if (file.type && !file.type.startsWith('image/')) {
        return { ok: false, reason: 'decode-failed' };
      }
      blob = file;
    }

    try {
      const bitmap = await decodeControlledImageBitmap(blob);
      return { ok: true, bitmap };
    } catch {
      return { ok: false, reason: 'decode-failed' };
    }
  } catch (err) {
    if (isUserCancelledAction(err)) return { ok: false, reason: 'cancelled' };
    return { ok: false, reason: 'unavailable' };
  }
}
