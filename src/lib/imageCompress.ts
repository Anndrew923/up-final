const DEFAULT_MAX_EDGE = 384;
/** ~130KB JPEG base64 typical; hard cap avoids Firestore / localStorage blowups. */
const DEFAULT_MAX_DATA_URL_CHARS = 180_000;

export type ImageCompressCode =
  | 'no-document'
  | 'not-image'
  | 'decode-failed'
  | 'empty-image'
  | 'no-canvas-ctx'
  | 'too-large';

export class ImageCompressError extends Error {
  readonly code: ImageCompressCode;

  constructor(code: ImageCompressCode) {
    super(code);
    this.name = 'ImageCompressError';
    this.code = code;
  }
}

/**
 * Downscales a raster image and returns a JPEG data URL for local persistence / leaderboard payload.
 * Runs in the browser only (Canvas + ImageBitmap).
 */
export async function compressImageFileToDataUrl(
  file: File,
  options?: { maxEdge?: number; maxDataUrlChars?: number }
): Promise<string> {
  if (typeof document === 'undefined') {
    throw new ImageCompressError('no-document');
  }
  if (!file.type.startsWith('image/')) {
    throw new ImageCompressError('not-image');
  }

  const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE;
  const maxChars = options?.maxDataUrlChars ?? DEFAULT_MAX_DATA_URL_CHARS;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageCompressError('decode-failed');
  }
  try {
    const { width, height } = bitmap;
    if (!width || !height) {
      throw new ImageCompressError('empty-image');
    }
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new ImageCompressError('no-canvas-ctx');
    }
    ctx.drawImage(bitmap, 0, 0, w, h);

    let quality = 0.88;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > maxChars && quality > 0.42) {
      quality -= 0.06;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    if (dataUrl.length > maxChars) {
      throw new ImageCompressError('too-large');
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}
