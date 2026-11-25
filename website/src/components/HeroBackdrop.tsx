import { useState } from 'react';
import {
  HERO_VIDEO_SRC,
  MARKETING_POSTER_SRC,
} from '../config/marketingMedia';
import { OptionalLoopVideo } from './OptionalLoopVideo';

const HERO_MEDIA =
  'absolute inset-0 h-full w-full object-cover object-[center_38%]';

/**
 * Ladder-style full-bleed hero media — clear upper half, ink wash only in lower 50%.
 * WHY: Thick full-frame darken hid the training still; bottom-only gradient keeps
 * type/CTAs readable while the photo/video subject stays visible. No media chrome —
 * first viewport stays a pure stage.
 */
export function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={MARKETING_POSTER_SRC}
        alt=""
        className={HERO_MEDIA}
        decoding="async"
        fetchPriority="high"
        loading="eager"
      />

      {HERO_VIDEO_SRC ? <HeroLoopOverlay src={HERO_VIDEO_SRC} /> : null}

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
    </div>
  );
}

/**
 * Silent autoplay overlay — only mounts when `HERO_VIDEO_SRC` is set.
 * WHY separate node: ready-fade needs state, but still-only Hero must stay
 * hook-free (no dead useState while video SSOT is null).
 */
function HeroLoopOverlay({ src }: { src: string }) {
  const [ready, setReady] = useState(false);

  return (
    <OptionalLoopVideo
      src={src}
      poster={MARKETING_POSTER_SRC}
      onReadyChange={setReady}
      className={`${HERO_MEDIA} transition-opacity duration-500 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
