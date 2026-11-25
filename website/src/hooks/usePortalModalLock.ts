import { useEffect } from 'react';

/**
 * Escape + body scroll lock for portaled modals / lightboxes.
 * WHY: ImageLightbox and TelemetryDossierModal must share one a11y contract
 * so Escape / overflow restore never drift.
 */
export function usePortalModalLock(onClose: () => void): void {
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
}
