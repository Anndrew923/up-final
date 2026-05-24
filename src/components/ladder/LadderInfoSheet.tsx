import { type FC, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export interface LadderInfoSheetDetailRow {
  label: string;
  value: string;
}

export interface LadderInfoSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  /** Optional labeled rows (e.g. homologation vehicle benchmark + reference value). */
  detailRows?: LadderInfoSheetDetailRow[];
}

const LadderInfoSheet: FC<LadderInfoSheetProps> = ({ open, onClose, title, body, detailRows }) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const bodyId = useId();
  const detailsId = useId();
  const hasDetailRows = detailRows != null && detailRows.length > 0;
  const describedBy = hasDetailRows ? `${bodyId} ${detailsId}` : bodyId;

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
        aria-describedby={describedBy}
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-700 bg-bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-panel sm:rounded-2xl sm:pb-6"
      >
        <h2 id={titleId} className="text-base font-semibold tracking-tight text-zinc-50">
          {title}
        </h2>
        <p id={bodyId} className="mt-3 text-sm leading-relaxed text-zinc-300">
          {body}
        </p>
        {hasDetailRows ? (
          <dl id={detailsId} className="mt-4 space-y-3 border-t border-zinc-700/80 pt-4">
            {detailRows.map((row, index) => (
              <div key={`${row.label}-${index}`}>
                <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  {row.label}
                </dt>
                <dd className="mt-1 text-sm leading-snug text-zinc-200">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
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
