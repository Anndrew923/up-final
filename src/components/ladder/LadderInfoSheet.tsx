import { type FC, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';

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
  /** Optional visual variant for specialized layouts (e.g. sync-all ladder limits). */
  variant?: 'default' | 'syncAll';
}

interface LadderSyncLimitInfoProps {
  bodyId: string;
  body: string;
}

const LadderSyncLimitInfo: FC<LadderSyncLimitInfoProps> = ({ bodyId, body }) => {
  // Split advancedTip-style body into intro + bullet lines.
  const lines = body.split('\n').filter((line) => line.trim().length > 0);
  const intro = lines[0] ?? '';
  const bullets = lines.slice(1);

  return (
    <div id={bodyId} className="mt-3 space-y-4 text-[11px] leading-relaxed text-zinc-300">
      <p className="text-xs text-zinc-400">{intro}</p>
      {bullets.length > 0 ? (
        <div className="space-y-2.5">
          {bullets.map((line, index) => {
            const content = line.replace(/^-+\s*/, '');
            return (
              <div
                key={`${content}-${index}`}
                className="flex items-start gap-2 rounded-md border border-zinc-800/80 bg-zinc-900/50 px-2.5 py-2"
              >
                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary" />
                <p className="text-[11px] leading-snug text-zinc-300">{content}</p>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const LadderInfoSheet: FC<LadderInfoSheetProps> = ({
  open,
  onClose,
  title,
  body,
  detailRows,
  variant = 'default',
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const bodyId = useId();
  const detailsId = useId();
  const hasDetailRows = detailRows != null && detailRows.length > 0;
  const describedBy = hasDetailRows ? `${bodyId} ${detailsId}` : bodyId;

  useShellScrollLock(open);

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
      className="fixed inset-0 z-[210] flex items-center justify-center px-4 pt-4 pb-[calc(64px+env(safe-area-inset-bottom,0px))]"
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
        {variant === 'syncAll' ? (
          <LadderSyncLimitInfo bodyId={bodyId} body={body} />
        ) : (
          <p id={bodyId} className="mt-3 text-sm leading-relaxed text-zinc-300">
            {body}
          </p>
        )}
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
