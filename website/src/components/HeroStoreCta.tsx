import {
  resolveStoreAction,
  storeLinks,
  type StorePlatform,
} from '../config/storeLinks';
import { trackDownloadClick } from '../utils/metaPixel';

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
  'flex min-h-12 w-full items-center gap-2.5 rounded-xl border border-white/20 bg-zinc-950/90 px-3 py-2 text-left text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition hover:border-amber-400/60 hover:bg-zinc-900/95 active:scale-[0.98]';

function AppleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.22-1.98 1.09-3.13-1.06.04-2.34.7-3.1 1.58-.69.78-1.29 2.05-1.13 3.26 1.19.09 2.41-.62 3.14-1.71" />
    </svg>
  );
}

/** Four-color Play triangle mark — decorative only (not a trademark lockup). */
function GooglePlayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#00C3FF"
        d="M3.5 2.75A1.25 1.25 0 0 0 1.75 4v16A1.25 1.25 0 0 0 3.5 21.25L13 12 3.5 2.75Z"
      />
      <path
        fill="#FF3A44"
        d="M13 12 3.5 2.75a1.25 1.25 0 0 1 1.2-.35l13.1 7.45L13 12Z"
      />
      <path
        fill="#00F076"
        d="M13 12 17.8 14.15 4.7 21.6a1.25 1.25 0 0 1-1.2-.35L13 12Z"
      />
      <path
        fill="#FFD400"
        d="m17.8 9.85-4.8 2.15 4.8 2.15 1.55-.9a1.4 1.4 0 0 0 0-2.5l-1.55-.9Z"
      />
    </svg>
  );
}

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
        <AppleMark className="h-7 w-7 shrink-0 text-zinc-100" />
        <span className="min-w-0 leading-tight">
          <span className="block text-[9px] font-medium tracking-wide text-zinc-400 sm:text-[10px]">
            Download on the
          </span>
          <span className="block text-[13px] font-semibold tracking-tight text-white sm:text-sm">
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
          <span className="block text-[9px] font-medium tracking-wide text-zinc-400 sm:text-[10px]">
            GET IT ON
          </span>
          <span className="block text-[13px] font-semibold tracking-tight text-white sm:text-sm">
            Google Play
          </span>
        </span>
      </button>
    </div>
  );
}
