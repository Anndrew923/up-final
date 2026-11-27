import { useCallback, useState } from 'react';
import { Play } from 'lucide-react';
import {
  EXPLAINER_POSTER_SRC,
  EXPLAINER_VIDEO_SRC,
} from '../config/marketingMedia';
import { VideoLightbox } from './VideoLightbox';

export type ExplainerAspectRatio = '16:9' | '9:16';

interface ExplainerVideoCardProps {
  /** Optional still — omit / null uses lab texture only (no 404). */
  posterSrc?: string | null;
  /** Click-to-open theatre source — drop file at `website/public/videos/explainer.mp4`. */
  videoSrc?: string;
  /**
   * Preview card frame — landscape default; portrait for future 9:16 reels.
   * Lightbox always uses object-contain so either orientation fits without crop.
   */
  aspectRatio?: ExplainerAspectRatio;
}

const ASPECT_CLASS: Record<ExplainerAspectRatio, string> = {
  '16:9': 'aspect-video',
  '9:16': 'mx-auto aspect-[9/16] max-w-sm',
};

/**
 * Explainer preview Facade — click opens VideoLightbox theatre (no inline play).
 *
 * WHY Facade: Never mount `<video>` until the user opens the lightbox. First paint
 * stays a static card (zero video bytes / decoder work on the conversion viewport).
 * Missing mp4 / poster degrade inside the lightbox fallback, not browser chrome.
 */
export function ExplainerVideoCard({
  posterSrc = EXPLAINER_POSTER_SRC,
  videoSrc = EXPLAINER_VIDEO_SRC,
  aspectRatio = '16:9',
}: ExplainerVideoCardProps) {
  const [open, setOpen] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const showPoster = Boolean(posterSrc) && !posterFailed;

  // WHY: Stable onClose keeps usePortalModalLock from rebinding Escape/overflow each paint.
  const closeLightbox = useCallback(() => setOpen(false), []);

  return (
    <>
      <div
        className={`${ASPECT_CLASS[aspectRatio]} overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex h-full w-full items-center justify-center text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-energy"
          aria-label="點擊觀看完整介紹"
        >
          {/*
            WHY reuse theme grid + radial: same lab language as doc heroes;
            painted under optional poster so null/404 stills never blank the card.
          */}
          <div className="absolute inset-0 bg-zinc-950" aria-hidden>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,rgba(56,189,248,0.14),transparent_70%)]" />
            <div className="absolute inset-0 bg-grid-faint bg-grid opacity-70" />
          </div>

          {showPoster && posterSrc ? (
            <img
              src={posterSrc}
              alt=""
              decoding="async"
              onError={() => setPosterFailed(true)}
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
          ) : null}

          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
            aria-hidden
          />

          <span className="relative z-10 flex flex-col items-center gap-3">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full border border-energy/40 bg-black/60 backdrop-blur-md transition-all group-hover:scale-105 group-hover:border-energy sm:h-16 sm:w-16"
              aria-hidden
            >
              <Play className="h-6 w-6 fill-current text-energy sm:h-7 sm:w-7" />
            </span>
            <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-sm sm:text-sm">
              點擊觀看完整介紹
            </span>
          </span>

          <div className="absolute bottom-0 left-0 z-10 max-w-[90%] p-4 sm:p-5">
            <p className="ui-kicker-zh">開發者實測解析 · 01:00</p>
            <p className="mt-1 text-base font-bold text-white sm:text-xl">
              當了 15 年教練，為什麼我開發這套系統？
            </p>
          </div>
        </button>
      </div>

      {open ? (
        <VideoLightbox
          src={videoSrc}
          posterSrc={posterSrc}
          title="開發者實測解析"
          onClose={closeLightbox}
        />
      ) : null}
    </>
  );
}
