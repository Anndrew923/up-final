import { useId, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CLUB_DISPATCH_COMMENT_MAX_LEN,
  CLUB_DISPATCH_TAG_KEYS,
  clampDispatchComment,
  type ClubDispatchTagKey,
} from '../../logic/core/clubProgressDispatchUi';

export interface ClubProgressDispatchPanelProps {
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
  comment: string;
  onCommentChange: (next: string) => void;
  showHint: boolean;
  disabled?: boolean;
}

/**
 * Breakthrough opt-in club progress dispatch — presentational only.
 */
const ClubProgressDispatchPanel: FC<ClubProgressDispatchPanelProps> = ({
  enabled,
  onEnabledChange,
  comment,
  onCommentChange,
  showHint,
  disabled = false,
}) => {
  const { t } = useTranslation('common');
  const toggleId = useId();
  const commentId = useId();
  const len = comment.length;

  const applyTag = (key: ClubDispatchTagKey) => {
    const tag = t(`crew.dispatch.tag.${key}`);
    onCommentChange(clampDispatchComment(tag));
  };

  return (
    <section
      className="mt-3 space-y-2 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3"
      data-testid="club-progress-dispatch-panel"
      aria-label={t('crew.dispatch.panelAria')}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby={toggleId}
          disabled={disabled}
          data-testid="club-dispatch-broadcast-toggle"
          className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
            enabled ? 'bg-cyan-500' : 'bg-zinc-700'
          }`}
          onClick={() => onEnabledChange(!enabled)}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              enabled ? 'left-4' : 'left-0.5'
            }`}
          />
        </button>
        <div className="min-w-0 flex-1">
          <p id={toggleId} className="text-xs font-medium text-cyan-100/95">
            {t('crew.dispatch.broadcastToggle')}
          </p>
          {showHint ? (
            <p className="mt-1 text-[11px] leading-snug text-zinc-500" data-testid="club-dispatch-hint">
              {t('crew.dispatch.broadcastHint')}
            </p>
          ) : null}
        </div>
      </div>

      {enabled ? (
        <>
          <div>
            <label htmlFor={commentId} className="sr-only">
              {t('crew.dispatch.commentLabel')}
            </label>
            <input
              id={commentId}
              type="text"
              inputMode="text"
              autoComplete="off"
              maxLength={CLUB_DISPATCH_COMMENT_MAX_LEN}
              disabled={disabled}
              data-testid="club-dispatch-comment"
              placeholder={t('crew.dispatch.commentPlaceholder')}
              value={comment}
              onChange={(event) => onCommentChange(clampDispatchComment(event.target.value))}
              className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none disabled:opacity-40"
            />
            <p
              className="mt-1 text-right font-mono text-[10px] text-zinc-500"
              data-testid="club-dispatch-comment-count"
            >
              {len}/{CLUB_DISPATCH_COMMENT_MAX_LEN}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('crew.dispatch.tagsAria')}>
            {CLUB_DISPATCH_TAG_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                disabled={disabled}
                data-testid={`club-dispatch-tag-${key}`}
                className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-cyan-500/40 hover:text-cyan-100 disabled:opacity-40"
                onClick={() => applyTag(key)}
              >
                {t(`crew.dispatch.tag.${key}`)}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
};

export default ClubProgressDispatchPanel;
