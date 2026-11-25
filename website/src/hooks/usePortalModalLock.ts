import { useEffect } from 'react';

/**
 * Escape + body scroll lock for modals / lightboxes.
 * WHY: DownloadModal, ImageLightbox, and TelemetryDossierModal share one a11y
 * contract so Escape / overflow restore never drift. `enabled` lets always-mounted
 * sheets (DownloadModal) skip the lock while closed.
 */
export function usePortalModalLock(
  onClose: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return undefined;
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
  }, [onClose, enabled]);
}
