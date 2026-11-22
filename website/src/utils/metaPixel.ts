/**
 * Optional Meta Pixel bootstrap.
 * WHY: Only load when VITE_META_PIXEL_ID is set. Init and PageView are split so SPA
 * route changes can track without double-firing on first paint.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[];
      loaded: boolean;
      version: string;
      push: (...args: unknown[]) => void;
    };
  }
}

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID?.trim() ?? '';

let bootstrapped = false;

/** Load fbevents stub + init. Does not emit PageView. */
export function initMetaPixel(): void {
  if (bootstrapped || !PIXEL_ID || typeof window === 'undefined') return;
  bootstrapped = true;

  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      const self = fbq as NonNullable<Window['fbq']>;
      if (self.callMethod) {
        self.callMethod(...args);
      } else {
        self.queue.push(args);
      }
    } as NonNullable<Window['fbq']>;

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('init', PIXEL_ID);
}

export function trackPageView(): void {
  if (!PIXEL_ID) return;
  window.fbq?.('track', 'PageView');
}

export function trackDownloadClick(platform: string): void {
  if (!PIXEL_ID) return;
  window.fbq?.('trackCustom', 'DownloadClick', { platform });
  window.fbq?.('track', 'Lead', { content_name: `download_${platform}` });
}
