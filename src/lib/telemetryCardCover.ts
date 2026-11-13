/**
 * Selfie cover-crop math for the offline telemetry card.
 * WHY: Keep object-fit:cover pure and DOM-free so the composer can degrade
 * invalid bitmaps to the carbon plate without screenshot libraries.
 */

/** `HTMLImageElement` or `ImageBitmap`. Structural so tests can pass a sized stand-in. */
export interface TelemetryBackgroundSource {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

export interface CoverSourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export function readBackgroundSize(
  source: TelemetryBackgroundSource
): { width: number; height: number } | null {
  // Prefer intrinsic pixels (`naturalWidth`) when present; CSS layout size is a last resort.
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  if (!(width > 0) || !(height > 0)) return null;
  return { width, height };
}

/**
 * `object-fit: cover` source window. Wider photos crop the sides; taller photos crop top and bottom.
 * Returns null when a dimension is unusable so the caller can drop to the carbon plate.
 */
export function resolveCoverSourceRect(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
): CoverSourceRect | null {
  if (!(imageWidth > 0) || !(imageHeight > 0) || !(frameWidth > 0) || !(frameHeight > 0)) {
    return null;
  }
  const frameAspect = frameWidth / frameHeight;
  const imageAspect = imageWidth / imageHeight;
  if (imageAspect > frameAspect) {
    const sh = imageHeight;
    const sw = imageHeight * frameAspect;
    return { sx: (imageWidth - sw) / 2, sy: 0, sw, sh };
  }
  const sw = imageWidth;
  const sh = imageWidth / frameAspect;
  return { sx: 0, sy: (imageHeight - sh) / 2, sw, sh };
}
