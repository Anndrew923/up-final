import { type FC, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export interface LadderInfoSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
}

const LadderInfoSheet: FC<LadderInfoSheetProps> = ({ open, onClose, title, body }) => {
  const { t } = useTranslation('common');
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[210] flex flex-col justify-end pt-4 pb-[calc(64px+env(safe-area-inset-bottom,0px))] sm:items-center sm:justify-center sm:px-4 sm:pt-4 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px))]"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label={t('cancel')}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-700 bg-bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-panel sm:rounded-2xl sm:pb-6"
      >
        <h2 id={titleId} className="text-base font-semibold tracking-tight text-zinc-50">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{body}</p>
        <button
          type="button"
          className="mt-5 w-full min-h-12 rounded-xl border border-zinc-600 bg-transparent text-base font-semibold text-zinc-200 hover:bg-zinc-800/80"
          onClick={onClose}
        >
          {t('cancel')}
        </button>
      </section>
    </div>,
    document.body
  );
};

export default LadderInfoSheet;
