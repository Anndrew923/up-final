import { useId } from 'react';
import { createPortal } from 'react-dom';
import { usePortalModalLock } from '../hooks/usePortalModalLock';

/**
 * Full-screen image lightbox — shared by Systems iPhone and community thumbs.
 * WHY: Escape / backdrop / body-scroll lock stay one implementation so surfaces
 * never drift on a11y or close UX. Verified athletes use TelemetryDossierModal.
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
  usePortalModalLock(onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90dvh] w-full max-w-lg pb-[max(0px,env(safe-area-inset-bottom,0px))]"
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
            onClick={onClose}
            className="shrink-0 rounded-full border border-zinc-600 bg-zinc-900/90 px-3 py-1 text-xs text-fg-secondary transition hover:border-zinc-400"
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
