/**
 * Local serif stack for certificate / selfie foil titles.
 * WHY: Android often lacks Songti/Noto Serif TC — UPSerifTC is bundled under public/fonts
 * (SIL OFL) so first-share Canvas rasterization cannot fall back to a gothic face.
 */
export const TELEMETRY_SERIF_FONT_STACK =
  '"UPSerifTC", "Noto Serif TC", "Songti TC", serif';

export const TELEMETRY_SANS_FONT_STACK =
  '"PingFang TC", "Noto Sans TC", "Helvetica Neue", sans-serif';

/**
 * Wait briefly for the bundled serif face before Canvas text paint.
 * Short-circuits when `document.fonts` is missing (Node / Vitest doubles).
 */
export async function ensureTelemetrySerifFontsReady(
  timeoutMs = 300
): Promise<void> {
  if (typeof document === 'undefined') return;
  const fonts = document.fonts;
  if (!fonts) return;

  const faceSpec = '700 52px UPSerifTC';
  // Already resident — skip the race so share latency stays near zero after first paint.
  if (typeof fonts.check === 'function' && fonts.check(faceSpec)) return;

  const loadFace =
    typeof fonts.load === 'function'
      ? fonts.load(faceSpec).catch(() => undefined)
      : Promise.resolve(undefined);
  const ready =
    fonts.ready && typeof (fonts.ready as Promise<unknown>).then === 'function'
      ? fonts.ready.catch(() => undefined)
      : Promise.resolve(undefined);

  await Promise.race([
    Promise.all([loadFace, ready]),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
}
