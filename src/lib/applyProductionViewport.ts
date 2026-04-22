/**
 * Dev uses `index.html` viewport (zoom allowed). Production tightens meta for
 * WebView / APK-style layout stability (pinch zoom disabled).
 */
const PROD_VIEWPORT =
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

export function applyProductionViewport(): void {
  if (!import.meta.env.PROD) return;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    document.head.prepend(meta);
  }
  meta.setAttribute('content', PROD_VIEWPORT);
}
