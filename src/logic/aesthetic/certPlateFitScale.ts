/**
 * Fit a fixed logical certificate plate into a viewport without cropping.
 * WHY: DOM preview must match canvas logical sizes (1080×1920 / 1080×1350) via
 * uniform scale — flex-shrinking the plate was clipping battleCode / meters.
 */
export function resolveCertPlateFitScale(
  viewportW: number,
  viewportH: number,
  plateW: number,
  plateH: number
): number {
  if (viewportW <= 0 || viewportH <= 0 || plateW <= 0 || plateH <= 0) return 0;
  return Math.min(viewportW / plateW, viewportH / plateH);
}
