import { useState } from 'react';
import { Play } from 'lucide-react';
import {
  EXPLAINER_POSTER_SRC,
  EXPLAINER_VIDEO_SRC,
} from '../config/marketingMedia';

type Phase = 'facade' | 'playing' | 'error';

interface ExplainerVideoCardProps {
  /** Optional still — omit / null uses lab texture only (no 404). */
  posterSrc?: string | null;
  /** Click-to-mount source — drop file at `website/public/videos/explainer.mp4`. */
  videoSrc?: string;
}

/**
 * 16:9 developer explainer — Facade click-to-play between Hero CTAs and #systems.
 *
 * WHY Facade: Never mount `<video>` until the user clicks. First paint stays a
 * static card (zero video bytes / decoder work on the conversion viewport).
 * Missing mp4 / poster degrade to a dark lab texture + dashboard copy instead
 * of browser broken-media chrome.
 */
export function ExplainerVideoCard({
  posterSrc = EXPLAINER_POSTER_SRC,
  videoSrc = EXPLAINER_VIDEO_SRC,
}: ExplainerVideoCardProps) {
  const [phase, setPhase] = useState<Phase>('facade');
  const [posterFailed, setPosterFailed] = useState(false);
  const showPoster = Boolean(posterSrc) && !posterFailed;

  return (
    <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl">
      {phase === 'playing' ? (
        <video
          key={videoSrc}
          src={videoSrc}
          controls
          autoPlay
          playsInline
          className="h-full w-full object-cover"
          onError={() => {
            // WHY: Asset may not ship yet — swap to dashboard fallback, never native error UI.
            setPhase('error');
          }}
        />
      ) : null}

      {phase === 'error' ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center"
          role="status"
        >
          <p className="text-base font-semibold text-white sm:text-xl">
            實測解析影片後製中 · 即將上線
          </p>
          <button
            type="button"
            onClick={() => setPhase('facade')}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-fg-secondary transition hover:border-energy/40 hover:text-energy"
          >
            返回封面
          </button>
        </div>
      ) : null}

      {phase === 'facade' ? (
        <button
          type="button"
          onClick={() => setPhase('playing')}
          className="group relative flex h-full w-full items-center justify-center text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-energy"
          aria-label="播放開發者實測解析影片"
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

          <span
            className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-energy/40 bg-black/60 backdrop-blur-md transition-all group-hover:scale-105 group-hover:border-energy sm:h-16 sm:w-16"
            aria-hidden
          >
            <Play className="h-6 w-6 fill-current text-energy sm:h-7 sm:w-7" />
          </span>

          <div className="absolute bottom-0 left-0 z-10 max-w-[90%] p-4 sm:p-5">
            <p className="ui-kicker-zh">開發者實測解析 · 01:00</p>
            <p className="mt-1 text-base font-bold text-white sm:text-xl">
              當了 15 年教練，為什麼我開發這套系統？
            </p>
          </div>
        </button>
      ) : null}
    </div>
  );
}
