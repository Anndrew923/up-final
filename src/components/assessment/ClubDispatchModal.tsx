import { useEffect, useId, useRef, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import {
  CLUB_DISPATCH_COMMENT_MAX_LEN,
  CLUB_DISPATCH_TAG_KEYS,
  clampDispatchComment,
  finalizeDispatchComment,
  type ClubDispatchTagKey,
} from '../../logic/core/clubProgressDispatchUi';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import AuraReactiveFrame from './AuraReactiveFrame';
import type { PerformanceAuraKey } from '../../logic/core/performanceAura';

export interface ClubDispatchModalProps {
  open: boolean;
  scoreDisplay: string;
  /** Optional signed delta label (e.g. "+1.20"). Hidden when empty. */
  deltaDisplay?: string | null;
  title?: string | null;
  auraKey?: PerformanceAuraKey;
  busy?: boolean;
  onClose: () => void;
  onBroadcast: (comment: string) => void;
  onSilentSync: () => void;
}

/**
 * Dedicated celebration sheet for club progress dispatch (broadcast vs silent sync).
 * WHY: Keeps PerformanceBreakthroughModal score-first; declaration is a second intentional beat.
 */
const ClubDispatchModal: FC<ClubDispatchModalProps> = ({
  open,
  scoreDisplay,
  deltaDisplay = null,
  title = null,
  auraKey = 'flow',
  busy = false,
  onClose,
  onBroadcast,
  onSilentSync,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const commentId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [comment, setComment] = useState('');

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    setComment('');
  }, [open, scoreDisplay]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const applyTag = (key: ClubDispatchTagKey) => {
    const tag = t(`crew.dispatch.tag.${key}`);
    setComment(clampDispatchComment(tag));
  };

  const deltaText = typeof deltaDisplay === 'string' ? deltaDisplay.trim() : '';

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.clubDispatchModal} flex items-center justify-center ui-modal-safe-shell`}
      role="presentation"
      data-testid="club-dispatch-modal"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label={t('crew.dispatch.closeAria')}
        disabled={busy}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md motion-reduce:animate-none animate-breakthrough-enter will-change-[transform,opacity]"
        onClick={(event) => event.stopPropagation()}
      >
        <AuraReactiveFrame auraKey={auraKey} className="max-h-[min(88dvh,36rem)]">
          <div className="flex max-h-[min(88dvh,36rem)] flex-col gap-5">
            <header className="space-y-2 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-500">
                {t('crew.dispatch.modalKicker')}
              </p>
              <h2 id={titleId} className="text-lg font-bold tracking-tight text-zinc-50">
                {title?.trim() || t('crew.dispatch.modalTitle')}
              </h2>
              <p
                className="font-mono text-4xl font-semibold tracking-tight text-emerald-300"
                data-testid="club-dispatch-score"
              >
                {scoreDisplay}
              </p>
              {deltaText ? (
                <p
                  className="font-mono text-sm font-medium text-cyan-300/90"
                  data-testid="club-dispatch-delta"
                >
                  {t('crew.dispatch.deltaLabel', { delta: deltaText })}
                </p>
              ) : null}
            </header>

            <div className="space-y-2">
              <label htmlFor={commentId} className="sr-only">
                {t('crew.dispatch.commentLabel')}
              </label>
              <input
                id={commentId}
                type="text"
                inputMode="text"
                autoComplete="off"
                maxLength={CLUB_DISPATCH_COMMENT_MAX_LEN}
                disabled={busy}
                data-testid="club-dispatch-comment"
                placeholder={t('crew.dispatch.commentPlaceholder')}
                value={comment}
                onChange={(event) => setComment(clampDispatchComment(event.target.value))}
                className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none disabled:opacity-40"
              />
              <p
                className="text-right font-mono text-[10px] text-zinc-500"
                data-testid="club-dispatch-comment-count"
              >
                {comment.length}/{CLUB_DISPATCH_COMMENT_MAX_LEN}
              </p>

              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label={t('crew.dispatch.tagsAria')}
              >
                {CLUB_DISPATCH_TAG_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    disabled={busy}
                    data-testid={`club-dispatch-tag-${key}`}
                    className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-cyan-500/40 hover:text-cyan-100 disabled:opacity-40"
                    onClick={() => applyTag(key)}
                  >
                    {t(`crew.dispatch.tag.${key}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                data-testid="club-dispatch-broadcast-sync"
                disabled={busy}
                className="w-full rounded-xl bg-cyan-500 py-3 text-sm font-medium text-black transition-all duration-200 hover:bg-cyan-400 disabled:pointer-events-none disabled:opacity-40"
                onClick={() => onBroadcast(finalizeDispatchComment(comment))}
              >
                {busy ? t('crew.dispatch.syncing') : t('crew.dispatch.broadcastAndSync')}
              </button>
              <button
                type="button"
                data-testid="club-dispatch-silent-sync"
                disabled={busy}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium tracking-tight text-zinc-200 transition-all duration-200 hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40"
                onClick={onSilentSync}
              >
                {busy ? t('crew.dispatch.syncing') : t('crew.dispatch.silentSync')}
              </button>
            </div>
          </div>
        </AuraReactiveFrame>
      </div>
    </div>,
    document.body
  );
};

export default ClubDispatchModal;
