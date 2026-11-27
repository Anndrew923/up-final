import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { usePortalModalLock } from '../hooks/usePortalModalLock';

export interface VideoLightboxProps {
  src: string;
  title: string;
  posterSrc?: string | null;
  onClose: () => void;
}

/**
 * Full-screen video theatre lightbox — Explainer (and future promo clips).
 * WHY: Keep playback off the inline preview card so the conversion viewport stays
 * a static Facade; Escape / backdrop / body-scroll lock share ImageLightbox a11y.
 *
 * Width: `w-full max-w-5xl` inside padded overlay (≈95vw on phone without
 * `95vw + padding` horizontal overflow). Media: `object-contain` + `max-h-[85svh]`
 * so 16:9 and 9:16 both fit without crop.
 */
export function VideoLightbox({
  src,
  title,
  posterSrc,
  onClose,
}: VideoLightboxProps) {
  const titleId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /** Ignore media errors fired while we tear down src (pause → clear → unmount). */
  const tearingDownRef = useRef(false);
  const [phase, setPhase] = useState<'playing' | 'error'>('playing');

  const stopPlayback = useCallback(() => {
    tearingDownRef.current = true;
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    // WHY: Drop src so the decoder/network stop before React unmounts the portal.
    // Skip el.load() — empty-src load emits onError and races setState during close.
    el.removeAttribute('src');
  }, []);

  const handleClose = useCallback(() => {
    stopPlayback();
    onClose();
  }, [onClose, stopPlayback]);

  usePortalModalLock(handleClose);

  // Belt-and-suspenders: parent remount / Strict Mode unmount must not leave audio.
  useEffect(() => {
    return () => {
      tearingDownRef.current = true;
      const el = videoRef.current;
      if (!el) return;
      el.pause();
      el.removeAttribute('src');
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-5xl pb-[max(0px,env(safe-area-inset-bottom,0px))]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <p
            id={titleId}
            className="min-w-0 pt-0.5 text-xs leading-snug tracking-wide text-fg-secondary"
          >
            {title}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/90 text-fg-secondary transition hover:border-zinc-400 hover:text-fg"
            aria-label="關閉影片"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {phase === 'playing' ? (
          <video
            ref={videoRef}
            key={src}
            src={src}
            poster={posterSrc ?? undefined}
            controls
            autoPlay
            playsInline
            className="max-h-[85svh] w-full rounded-xl border border-zinc-700 bg-black object-contain shadow-2xl"
            onError={() => {
              if (tearingDownRef.current) return;
              // WHY: Asset may not ship yet — swap to dashboard fallback, never native error UI.
              setPhase('error');
            }}
          />
        ) : (
          <div
            className="flex max-h-[85svh] min-h-[12rem] w-full flex-col items-center justify-center gap-4 rounded-xl border border-zinc-700 bg-zinc-950 px-6 py-16 text-center shadow-2xl"
            role="status"
          >
            <p className="text-base font-semibold text-white sm:text-xl">
              實測解析影片後製中 · 即將上線
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-fg-secondary transition hover:border-energy/40 hover:text-energy"
            >
              關閉
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
