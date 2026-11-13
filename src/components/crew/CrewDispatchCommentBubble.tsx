import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface CrewDispatchCommentBubbleProps {
  comment: string;
}

/**
 * Telemetry-style dispatch comment bubble for push-tap deep links.
 * Presentational only — parent gates render on non-empty comment.
 */
const CrewDispatchCommentBubble: FC<CrewDispatchCommentBubbleProps> = ({ comment }) => {
  const { t } = useTranslation('common');
  const trimmed = comment.trim();
  if (!trimmed) return null;

  return (
    <aside
      className="rounded-xl border border-zinc-700/80 border-l-2 border-l-cyan-400/80 bg-zinc-950/70 px-3 py-2.5 backdrop-blur-sm"
      data-testid="crew-dispatch-comment-bubble"
      aria-label={t('crew.dispatch.commentBubble.kicker')}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
        {t('crew.dispatch.commentBubble.kicker')}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-100">
        {trimmed}
      </p>
    </aside>
  );
};

export default CrewDispatchCommentBubble;
