import {
  resolveStoreAction,
  storeLinks,
  type StorePlatform,
} from '../config/storeLinks';
import { trackDownloadClick } from '../utils/metaPixel';
import { AppleMark, GooglePlayMark } from './StoreBrandMarks';

/**
 * Hero dual-store CTA — App Store + Google Play side by side.
 * WHY: `id="hero-primary-cta"` stays on the grid so StickyDownloadBar IntersectionObserver
 * continues to hide the mobile sticky while this cluster is on-screen.
 *
 * Click policy via `resolveStoreAction` (storeLinks SSOT — never invent URLs):
 * - Available URL → open listing + pixel
 * - Unavailable (e.g. iOS pending) → DownloadModal via onDownload
 */

const STORE_BTN =
  'flex min-h-12 w-full items-center gap-2.5 rounded-xl border border-white/20 bg-zinc-950/90 px-3 py-2 text-left text-fg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition hover:border-amber-400/60 hover:bg-zinc-900/95 active:scale-[0.98]';

interface HeroStoreCtaProps {
  onDownload: () => void;
}

export function HeroStoreCta({ onDownload }: HeroStoreCtaProps) {
  const openStore = (platform: StorePlatform) => {
    trackDownloadClick(platform);
    const action = resolveStoreAction(platform);
    if (action.kind === 'open') {
      window.open(action.url, '_blank', 'noopener,noreferrer');
      return;
    }
    onDownload();
  };

  return (
    <div
      id="hero-primary-cta"
      className="mx-auto mt-8 grid w-full max-w-md grid-cols-2 gap-3 sm:mt-10"
      role="group"
      aria-label="下載最強肉體 App"
    >
      <button
        type="button"
        onClick={() => openStore('ios')}
        className={STORE_BTN}
        aria-label={
          storeLinks.iosAvailable
            ? 'Download on the App Store'
            : 'App Store 即將上架 — 開啟下載引導'
        }
      >
        <AppleMark className="h-7 w-7 shrink-0 text-fg" />
        <span className="min-w-0 leading-tight">
          <span className="block text-xs font-medium tracking-wide text-fg-muted sm:text-xs">
            Download on the
          </span>
          <span className="block text-sm font-semibold tracking-tight text-fg sm:text-sm">
            App Store
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => openStore('android')}
        className={STORE_BTN}
        aria-label={
          storeLinks.androidAvailable
            ? 'GET IT ON Google Play'
            : 'Google Play 準備中 — 開啟下載引導'
        }
      >
        <GooglePlayMark className="h-7 w-7 shrink-0" />
        <span className="min-w-0 leading-tight">
          <span className="block text-xs font-medium tracking-wide text-fg-muted sm:text-xs">
            GET IT ON
          </span>
          <span className="block text-sm font-semibold tracking-tight text-fg sm:text-sm">
            Google Play
          </span>
        </span>
      </button>
    </div>
  );
}
