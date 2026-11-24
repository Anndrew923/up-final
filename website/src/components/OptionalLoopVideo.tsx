import { useEffect, useRef, useState } from 'react';

/**
 * Optional autoplay loop — mount only when parent has a real `src`.
 * WHY: Keeps video hooks out of still-only parents (no dead useRef when media is null).
 */
export function OptionalLoopVideo({
  src,
  poster,
  className,
  onReadyChange,
}: {
  src: string;
  poster: string;
  className?: string;
  onReadyChange?: (ready: boolean) => void;
}) {
  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      preload="metadata"
      onLoadedData={() => onReadyChange?.(true)}
      onError={() => {
        // WHY: Corrupt/missing file must never blank the stage — caller keeps poster.
        onReadyChange?.(false);
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

/** Imperative play/pause for Hero control chrome when a video source is configured. */
export function useLoopVideoControls(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    const el = videoRef.current;
    if (!el) return undefined;

    const sync = () => setPlaying(!el.paused);
    el.addEventListener('play', sync);
    el.addEventListener('pause', sync);
    return () => {
      el.removeEventListener('play', sync);
      el.removeEventListener('pause', sync);
    };
  }, [enabled]);

  const toggle = () => {
    const el = videoRef.current;
    if (!el || !ready) return;
    if (el.paused) {
      void el.play().catch(() => {
        /* Autoplay policy — stay on poster. */
      });
    } else {
      el.pause();
    }
  };

  return {
    videoRef,
    playing,
    ready,
    setReady,
    setPlaying,
    toggle,
  };
}
