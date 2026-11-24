import { useCallback, useRef, useState, type UIEvent } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import {
  MARKETING_POSTER_SRC,
  SYSTEM_VIDEO_SRC,
  type SystemTabId,
} from '../config/marketingMedia';
import { OptionalLoopVideo } from './OptionalLoopVideo';

/** Hide native scrollbars while keeping touch/trackpad pan (matches Athletes). */
export const HIDE_SCROLLBAR =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const PHONE_SCREEN =
  'relative aspect-[9/16.2] max-h-[46svh] w-full bg-void sm:aspect-[9/19] sm:max-h-none';

/*
  WHY: App stills are taller than the bezel (9/16.2). object-cover clipped
  status/nav; contain keeps the full UI inside the frame (single + multi).
 */
const PHONE_MEDIA_FIT =
  'absolute inset-0 h-full w-full bg-void object-contain object-center';

const ZOOM_BADGE =
  'pointer-events-none absolute right-3 z-[2] inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/55 px-2 py-1 font-mono text-[9px] tracking-wide text-zinc-200 shadow-lg backdrop-blur-sm sm:right-3.5 sm:text-[10px]';

const CHEVRON_BTN =
  'absolute top-1/2 z-[2] hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-zinc-100 opacity-0 backdrop-blur-sm transition enabled:hover:border-white/40 enabled:hover:bg-black/65 disabled:pointer-events-none sm:flex sm:group-hover:enabled:opacity-100';

export type PhoneCarouselTabMeta = {
  sys: SystemTabId;
  tabShort: string;
  phoneLabel: string;
};

function PhoneStill({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      className={PHONE_MEDIA_FIT}
      decoding="async"
      loading="lazy"
    />
  );
}

function PhoneVideo({ src, poster }: { src: string; poster: string }) {
  const [videoOk, setVideoOk] = useState(false);

  return (
    <>
      <img
        src={poster}
        alt=""
        className={`${PHONE_MEDIA_FIT} transition-opacity ${
          videoOk ? 'opacity-0' : 'opacity-100'
        }`}
        decoding="async"
        loading="lazy"
      />
      <OptionalLoopVideo
        src={src}
        poster={poster}
        onReadyChange={setVideoOk}
        className={`${PHONE_MEDIA_FIT} transition-opacity ${
          videoOk ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}

/**
 * iPhone screen still / snap carousel.
 * WHY: Lives outside SystemsShowcase so tab chrome stays lean; multi-only chrome
 * (dots + chevrons) never mounts for length === 1.
 */
export function PhoneSystemCarousel({
  item,
  previews,
  slideIndex,
  onSlideChange,
  onOpenLightbox,
}: {
  item: PhoneCarouselTabMeta;
  previews: readonly string[];
  slideIndex: number;
  onSlideChange: (index: number) => void;
  onOpenLightbox: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const multi = previews.length > 1;

  const scrollToSlide = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(index, previews.length - 1));
      el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
      onSlideChange(clamped);
    },
    [onSlideChange, previews.length],
  );

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.clientWidth <= 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== slideIndex) onSlideChange(next);
  };

  if (!multi) {
    const only = previews[0] ?? MARKETING_POSTER_SRC;
    /*
      WHY: Demo loop only for single-still tabs. All four Systems tabs are
      multi-still today — video must not hijack swipe frames.
    */
    const useVideo = Boolean(SYSTEM_VIDEO_SRC);
    const zoomLabel = `放大檢視 ${item.sys} ${item.tabShort} · ${item.phoneLabel}`;

    return (
      <button
        type="button"
        onClick={onOpenLightbox}
        aria-label={zoomLabel}
        className={`${PHONE_SCREEN} group cursor-zoom-in text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-energy/70`}
      >
        {useVideo && SYSTEM_VIDEO_SRC ? (
          <PhoneVideo src={SYSTEM_VIDEO_SRC} poster={only} />
        ) : (
          <PhoneStill src={only} />
        )}
        <span
          className={`${ZOOM_BADGE} bottom-3 transition group-hover:border-white/35 group-hover:bg-black/70 sm:bottom-3.5`}
        >
          <ZoomIn className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
          點擊放大
        </span>
      </button>
    );
  }

  return (
    <div className={`${PHONE_SCREEN} group`}>
      {/*
        WHY: Track is the swipe surface; each slide is its own zoom button so
        click ≠ drag, and lightbox opens the visible frame.
      */}
      <div
        ref={scrollerRef}
        className={`flex h-full w-full overflow-x-auto snap-x snap-mandatory ${HIDE_SCROLLBAR}`}
        onScroll={onScroll}
        aria-roledescription="carousel"
        aria-label={`${item.sys} ${item.tabShort} 實機截圖輪播`}
      >
        {previews.map((src, index) => (
          <button
            key={`${item.sys}-${src}-${index}`}
            type="button"
            onClick={onOpenLightbox}
            aria-label={`放大檢視 ${item.sys} ${item.tabShort} · 畫面 ${index + 1}/${previews.length}`}
            className="relative h-full w-full shrink-0 snap-center cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-energy/70"
          >
            <img
              src={src}
              alt=""
              className="h-full w-full bg-void object-contain object-center"
              decoding="async"
              loading={index === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </button>
        ))}
      </div>

      {/* Lift zoom above dots so bottom metrics + pager never collide. */}
      <span className={`${ZOOM_BADGE} bottom-8 sm:bottom-9`}>
        <ZoomIn className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
        點擊放大
      </span>

      <div
        className="absolute inset-x-0 bottom-3 z-[2] flex justify-center gap-1.5 sm:bottom-3.5"
        role="group"
        aria-label="截圖分頁"
      >
        {previews.map((_, index) => {
          const selected = index === slideIndex;
          return (
            <button
              key={`dot-${item.sys}-${index}`}
              type="button"
              aria-label={`畫面 ${index + 1}`}
              aria-current={selected ? 'true' : undefined}
              onClick={() => scrollToSlide(index)}
              className={`h-1.5 rounded-full transition ${
                selected
                  ? 'w-3.5 bg-white/90'
                  : 'w-1.5 bg-white/35 hover:bg-white/55'
              }`}
            />
          );
        })}
      </div>

      <button
        type="button"
        aria-label="上一張截圖"
        onClick={() => scrollToSlide(slideIndex - 1)}
        disabled={slideIndex <= 0}
        className={`${CHEVRON_BTN} left-1.5`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="下一張截圖"
        onClick={() => scrollToSlide(slideIndex + 1)}
        disabled={slideIndex >= previews.length - 1}
        className={`${CHEVRON_BTN} right-1.5`}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
