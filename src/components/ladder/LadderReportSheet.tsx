import { type FC, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import type { LadderReportType } from '../../services/ladderReportService';
import { mapLadderReportError, submitLadderReport } from '../../services/ladderReportService';

export interface LadderReportSheetProps {
  open: boolean;
  targetUid: string;
  onClose: () => void;
  onSuccess: () => void;
}

const REPORT_TYPES: LadderReportType[] = ['nickname', 'avatar', 'both'];

const LadderReportSheet: FC<LadderReportSheetProps> = ({
  open,
  targetUid,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const [selectedType, setSelectedType] = useState<LadderReportType>('nickname');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<
    'success' | 'duplicate' | 'daily-cap' | 'not-found' | 'error' | null
  >(null);

  useEffect(() => {
    if (!open) return;
    setSelectedType('nickname');
    setFeedback(null);
    setBusy(false);
  }, [open, targetUid]);

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
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  const handleSubmit = async () => {
    if (!targetUid || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await submitLadderReport({ targetUid, type: selectedType });
      if (result.ok) {
        setFeedback('success');
        onSuccess();
        return;
      }
      if (!result.ok && result.reason === 'duplicate') {
        setFeedback('duplicate');
        return;
      }
      if (!result.ok && result.reason === 'daily-cap') {
        setFeedback('daily-cap');
        return;
      }
      if (!result.ok && result.reason === 'not-found') {
        setFeedback('not-found');
        return;
      }
      setFeedback('error');
    } catch (err) {
      const mapped = mapLadderReportError(err);
      if (!mapped.ok && mapped.reason === 'duplicate') {
        setFeedback('duplicate');
      } else if (!mapped.ok && mapped.reason === 'daily-cap') {
        setFeedback('daily-cap');
      } else if (!mapped.ok && mapped.reason === 'not-found') {
        setFeedback('not-found');
      } else {
        setFeedback('error');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[230] flex flex-col justify-end pb-[calc(64px+env(safe-area-inset-bottom,0px))] sm:items-center sm:justify-center sm:px-4 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px))]"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label={t('cancel')}
        disabled={busy}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-700 bg-bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-panel sm:rounded-2xl sm:pb-6"
      >
        <h2 id={titleId} className="text-base font-semibold tracking-tight text-zinc-50">
          {t('ladder.moderation.reportTitle')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {t('ladder.moderation.reportDescription')}
        </p>

        <fieldset className="mt-4 space-y-2" disabled={busy}>
          <legend className="sr-only">{t('ladder.moderation.reportTypeLegend')}</legend>
          {REPORT_TYPES.map((type) => (
            <label
              key={type}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/40 px-3 py-2 has-[:checked]:border-accent-info/60 has-[:checked]:bg-accent-info/10"
            >
              <input
                type="radio"
                name="ladder-report-type"
                className="h-4 w-4 accent-accent-info"
                checked={selectedType === type}
                onChange={() => setSelectedType(type)}
              />
              <span className="text-sm text-zinc-200">{t(`ladder.moderation.reportType.${type}`)}</span>
            </label>
          ))}
        </fieldset>

        {feedback === 'success' ? (
          <p className="mt-4 text-sm text-emerald-300" role="status" aria-live="polite">
            {t('ladder.moderation.reportSuccess')}
          </p>
        ) : null}
        {feedback === 'duplicate' ? (
          <p className="mt-4 text-sm text-amber-200" role="status" aria-live="polite">
            {t('ladder.moderation.reportDuplicate')}
          </p>
        ) : null}
        {feedback === 'daily-cap' ? (
          <p className="mt-4 text-sm text-amber-200" role="status" aria-live="polite">
            {t('ladder.moderation.reportDailyCap')}
          </p>
        ) : null}
        {feedback === 'not-found' ? (
          <p className="mt-4 text-sm text-amber-200" role="status" aria-live="polite">
            {t('ladder.moderation.reportTargetMissing')}
          </p>
        ) : null}
        {feedback === 'error' ? (
          <p className="mt-4 text-sm text-rose-200" role="status" aria-live="polite">
            {t('ladder.moderation.reportError')}
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="min-h-11 rounded-xl border border-zinc-600 bg-transparent px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800/80"
            disabled={busy}
            onClick={onClose}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl border border-accent-primary bg-accent-primary px-3 text-sm font-semibold text-black disabled:opacity-50"
            disabled={busy || feedback === 'success'}
            onClick={() => void handleSubmit()}
          >
            {busy ? t('ladder.moderation.reportSubmitting') : t('ladder.moderation.reportSubmit')}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
};

export default LadderReportSheet;
