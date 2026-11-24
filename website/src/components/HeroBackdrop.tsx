import { Pause, Play } from 'lucide-react';
import {
  HERO_VIDEO_SRC,
  MARKETING_POSTER_SRC,
} from '../config/marketingMedia';
import { useLoopVideoControls } from './OptionalLoopVideo';

const MEDIA_CTRL =
  'absolute right-4 z-10 flex h-9 items-center gap-1.5 rounded-full border px-3 font-mono text-[10px] tracking-wide backdrop-blur-md sm:right-6';

/**
 * Ladder-style full-bleed hero media — clear upper half, ink wash only in lower 50%.
 * WHY: Thick full-frame darken hid the training still; bottom-only gradient keeps
 * type/CTAs readable while the photo/video subject stays visible.
 *
 * Media control sits just under fixed chrome (not bottom-right) so it never collides
 * with the bottom-center store CTAs.
 */
export function HeroBackdrop() {
  const hasVideo = Boolean(HERO_VIDEO_SRC);
  const { videoRef, playing, ready, setReady, setPlaying, toggle } =
    useLoopVideoControls(hasVideo);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={MARKETING_POSTER_SRC}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
        decoding="async"
        fetchPriority="high"
        loading="eager"
      />

      {hasVideo && HERO_VIDEO_SRC ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover object-[center_38%] transition-opacity duration-500 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          muted
          loop
          playsInline
          poster={MARKETING_POSTER_SRC}
          preload="metadata"
          onLoadedData={() => {
            setReady(true);
            setPlaying(true);
          }}
          onError={() => {
            setReady(false);
            setPlaying(false);
          }}
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      ) : null}

      {/* Soft top veil — keeps fixed nav readable without muting the hero subject. */}
      <div
        className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/50 to-transparent"
        aria-hidden
      />

      {/* Lower 50% only: transparent → ink, matching Ladder bottom-anchor treatment. */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/85 to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent"
        aria-hidden
      />

      {hasVideo ? (
        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          className={`hero-media-ctrl-top pointer-events-auto ${MEDIA_CTRL} border-white/20 bg-black/55 text-zinc-200 transition hover:border-energy/50 hover:text-energy disabled:cursor-not-allowed disabled:opacity-40`}
          aria-label={playing ? '暫停動態背景' : '播放動態背景'}
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden />
          )}
          <span>{playing ? 'PAUSE' : 'PLAY'}</span>
        </button>
      ) : (
        <span
          className={`hero-media-ctrl-top pointer-events-none ${MEDIA_CTRL} border-white/15 bg-black/45 text-zinc-500`}
          aria-hidden
        >
          <Pause className="h-3.5 w-3.5" aria-hidden />
          <span>STILL</span>
        </span>
      )}
    </div>
  );
}
