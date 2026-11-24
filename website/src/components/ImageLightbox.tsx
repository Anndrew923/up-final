import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

/**
 * Full-screen image lightbox — shared by Athletes battle cards and Systems iPhone.
 * WHY: Escape / backdrop / body-scroll lock stay one implementation so #athletes
 * and #systems never drift on a11y or close UX.
 */
export function ImageLightbox({
  src,
  title,
  alt,
  onClose,
}: {
  src: string;
  title: string;
  alt?: string;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90dvh] w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        {/*
          WHY: Visible title (not sr-only) — Systems asks for tab title in the
          preview; Athletes reuse the same chrome without a second lightbox.
        */}
        <div className="mb-2 flex items-start justify-between gap-3">
          <p
            id={titleId}
            className="min-w-0 pt-0.5 font-mono text-[11px] leading-snug tracking-wide text-zinc-300"
          >
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-zinc-600 bg-zinc-900/90 px-3 py-1 font-mono text-[11px] text-zinc-200 transition hover:border-zinc-400"
          >
            關閉
          </button>
        </div>
        <img
          src={src}
          alt={alt ?? title}
          className="max-h-[80dvh] w-full rounded-xl border border-zinc-700 object-contain shadow-2xl"
        />
      </div>
    </div>,
    document.body,
  );
}
