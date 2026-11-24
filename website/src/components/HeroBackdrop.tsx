import { Pause, Play } from 'lucide-react';
import {
  HERO_VIDEO_SRC,
  MARKETING_POSTER_SRC,
} from '../config/marketingMedia';
import { useLoopVideoControls } from './OptionalLoopVideo';

/**
 * Ladder-style full-bleed hero media — poster always, optional looping video.
 * WHY: Reserve `<video>` wiring now; with no mp4 yet we degrade to poster without
 * broken media or console noise. Interactive PLAY/PAUSE only when a source is live;
 * STILL chrome marks the reserved slot when video is absent.
 */
export function HeroBackdrop() {
  const hasVideo = Boolean(HERO_VIDEO_SRC);
  const { videoRef, playing, ready, setReady, setPlaying, toggle } =
    useLoopVideoControls(hasVideo);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden={!hasVideo}
    >
      <img
        src={MARKETING_POSTER_SRC}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-40 blur-[2px]"
        decoding="async"
      />

      {hasVideo && HERO_VIDEO_SRC ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            ready ? 'opacity-55' : 'opacity-0'
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

      <div className="absolute inset-0 bg-ink/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/70" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
      <div className="absolute inset-0 bg-grid-faint bg-grid opacity-20" />
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-energy/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-zinc-500/10 blur-3xl" />

      {hasVideo ? (
        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          className="pointer-events-auto absolute bottom-4 right-4 z-10 flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 font-mono text-[10px] tracking-wide text-zinc-200 backdrop-blur-md transition hover:border-energy/50 hover:text-energy disabled:cursor-not-allowed disabled:opacity-40 sm:bottom-6 sm:right-6"
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
        <span className="pointer-events-none absolute bottom-4 right-4 z-10 flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 font-mono text-[10px] tracking-wide text-zinc-500 backdrop-blur-md sm:bottom-6 sm:right-6">
          <Pause className="h-3.5 w-3.5" aria-hidden />
          <span>STILL</span>
        </span>
      )}
    </div>
  );
}
