/**
 * Local-only telemetry PNG share.
 *
 * WHY: Battle reports must never touch Firebase Storage. Native writes a Cache
 * file and opens the system Share Sheet; web uses navigator.share or a download
 * anchor. User dismiss / Abort is a soft cancel, not an error toast.
 */
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isCapacitorNativePlatform } from '../lib/capacitorPlatform';
import { isUserCancelledAction } from '../lib/isUserCancelledAction';

export type TelemetryShareFailReason =
  | 'cancelled'
  | 'unavailable'
  | 'write-failed'
  | 'share-failed';

export type TelemetryShareResult =
  | { ok: true }
  | { ok: false; reason: TelemetryShareFailReason };

export interface ShareTelemetryCardInput {
  blob: Blob;
  /** Suggested download / cache file name. Defaults to a timestamped PNG. */
  fileName?: string;
  title?: string;
}

const DEFAULT_TITLE = 'ULTIMATE PHYSIQUE // TELEMETRY';

export function buildTelemetryCardFileName(now: number = Date.now()): string {
  return `ultimate-physique-telemetry-${now}.png`;
}

/**
 * Collapse path segments and strip unsafe characters so Cache writes cannot escape the directory.
 */
export function sanitizeTelemetryShareFileName(raw: string): string {
  const base = raw.replace(/\\/g, '/').split('/').pop()?.trim() ?? '';
  const safe =
    base.replace(/[^\w.\-()+\s]/g, '_').replace(/\s+/g, '-').replace(/^\.+/, '') ||
    'ultimate-physique-telemetry';
  return /\.png$/i.test(safe) ? safe : `${safe}.png`;
}

/** Strip `data:*;base64,` if present — Filesystem.writeFile wants raw base64 on native. */
export function blobToBase64Data(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('share-base64-read-failed'));
    reader.readAsDataURL(blob);
  });
}

async function shareNative(input: {
  blob: Blob;
  fileName: string;
  title: string;
}): Promise<TelemetryShareResult> {
  let uri: string;
  try {
    const data = await blobToBase64Data(input.blob);
    if (!data) return { ok: false, reason: 'write-failed' };
    const written = await Filesystem.writeFile({
      path: input.fileName,
      data,
      directory: Directory.Cache,
    });
    if (!written.uri) return { ok: false, reason: 'write-failed' };
    uri = written.uri;
  } catch {
    return { ok: false, reason: 'write-failed' };
  }

  try {
    await Share.share({
      title: input.title,
      dialogTitle: input.title,
      files: [uri],
    });
    return { ok: true };
  } catch (err) {
    if (isUserCancelledAction(err)) return { ok: false, reason: 'cancelled' };
    return { ok: false, reason: 'share-failed' };
  } finally {
    // Best-effort cache cleanup — ignore failures so share outcome stays authoritative.
    try {
      await Filesystem.deleteFile({
        path: input.fileName,
        directory: Directory.Cache,
      });
    } catch {
      /* ignore */
    }
  }
}

function triggerAnchorDownload(file: File): void {
  if (typeof document === 'undefined') {
    throw new Error('share-no-document');
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = file.name;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function shareWeb(input: {
  blob: Blob;
  fileName: string;
  title: string;
}): Promise<TelemetryShareResult> {
  const file = new File([input.blob], input.fileName, { type: 'image/png' });

  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const canShareFiles =
    typeof nav?.canShare === 'function' &&
    (() => {
      try {
        return nav.canShare({ files: [file] });
      } catch {
        return false;
      }
    })();

  if (canShareFiles && typeof nav?.share === 'function') {
    try {
      await nav.share({ files: [file], title: input.title });
      return { ok: true };
    } catch (err) {
      if (isUserCancelledAction(err)) return { ok: false, reason: 'cancelled' };
      return { ok: false, reason: 'share-failed' };
    }
  }

  try {
    triggerAnchorDownload(file);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/**
 * Share a composed telemetry PNG locally (Share Sheet / Web Share / download).
 * Never uploads. User cancel → `{ ok: false, reason: 'cancelled' }`.
 */
export async function shareTelemetryCardPng(
  input: ShareTelemetryCardInput
): Promise<TelemetryShareResult> {
  const fileName = sanitizeTelemetryShareFileName(
    input.fileName?.trim() || buildTelemetryCardFileName()
  );
  const title = input.title?.trim() || DEFAULT_TITLE;
  const blob = input.blob;

  if (!(blob instanceof Blob) || blob.size <= 0) {
    return { ok: false, reason: 'unavailable' };
  }

  if (isCapacitorNativePlatform()) {
    return shareNative({ blob, fileName, title });
  }
  return shareWeb({ blob, fileName, title });
}
