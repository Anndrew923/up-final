/**
 * Canonical viewport content — must stay byte-identical to `index.html`.
 * WHY: `viewport-fit=cover` must be present before first layout so
 * `env(safe-area-inset-*)` is non-zero on iOS / Android WebView.
 */
export const APP_VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

export function applyProductionViewport(): void {
  if (!import.meta.env.PROD) return;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    document.head.prepend(meta);
  }
  meta.setAttribute('content', APP_VIEWPORT_CONTENT);
}
