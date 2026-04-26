import { useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeaderboardShardId } from '../../logic/core/ladderShards';
import { formatRateLimitResetAt } from '../../lib/formatRateLimitResetAt';
import { useLeaderboardUpload, resolveLeaderboardUploadGate } from '../../hooks/useLeaderboardUpload';
import { LEADERBOARD_UPLOADS_PER_HOUR } from '../../services/rateLimitService';

export interface LeaderboardUploadBarProps {
  metric: LeaderboardShardId;
  /** Persisted / radar-aligned score (e.g. from `scoreStore` or overall from radar hook). */
  score: number | null | undefined;
  /** When false, omits the repeated “Arena upload” kicker (stacked ladder actions on one page). */
  showSectionTitle?: boolean;
}

/**
 * Shared “upload this score to ladder” block for assessment pages and home overall.
 */
const LeaderboardUploadBar: FC<LeaderboardUploadBarProps> = ({
  metric,
  score,
  showSectionTitle = true,
}) => {
  const { t, i18n } = useTranslation('common');
  const gate = resolveLeaderboardUploadGate(score);
  const { upload, busy, lastResult, goJoinArena, clearFeedback } = useLeaderboardUpload();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    clearFeedback();
  }, [metric, score, showSectionTitle, clearFeedback]);

  const disabled = gate !== 'ok' || busy || !Number.isFinite(score ?? NaN);

  const statusText = (() => {
    if (!lastResult) return null;
    if (lastResult.ok && lastResult.updated) {
      return t('ladder.upload.resultUpdated');
    }
    if (lastResult.reason === 'rate-limited') {
      return t('ladder.upload.resultRateLimitedDetail', {
        limit: lastResult.limitPerHour ?? LEADERBOARD_UPLOADS_PER_HOUR,
        resetTime: formatRateLimitResetAt(lastResult.rateLimitResetAt, locale),
      });
    }
    if (lastResult.reason === 'pro-required') {
      return t('ladder.upload.resultProRequired');
    }
    if (lastResult.ok) {
      return t('ladder.upload.resultNoop');
    }
    return t('ladder.upload.resultError');
  })();

  const quotaSubline =
    lastResult?.ok && lastResult.updated && lastResult.rateLimitResetAt != null
      ? t('ladder.upload.quotaAfterSuccess', {
          remaining: lastResult.rateLimitRemaining ?? 0,
          limit: lastResult.limitPerHour ?? LEADERBOARD_UPLOADS_PER_HOUR,
          resetTime: formatRateLimitResetAt(lastResult.rateLimitResetAt, locale),
        })
      : null;

  return (
    <div className="space-y-2 border-t border-zinc-800/80 pt-4">
      {showSectionTitle ? (
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {t('ladder.upload.sectionTitle')}
        </p>
      ) : null}
      {gate !== 'ok' ? (
        <p className="text-xs leading-relaxed text-zinc-500">{t(`ladder.upload.gate.${gate}`)}</p>
      ) : (
        <p className="text-xs leading-relaxed text-zinc-500">
          {t('ladder.upload.quotaHint', { limit: LEADERBOARD_UPLOADS_PER_HOUR })}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="ui-btn border-accent-primary/40 text-accent-primary"
          disabled={disabled}
          onClick={() => {
            if (score != null && Number.isFinite(score)) {
              void upload(metric, score);
            }
          }}
        >
          {busy ? t('ladder.upload.uploading') : t('ladder.upload.button')}
        </button>
        {gate === 'no-pro' ? (
          <button type="button" className="ui-btn text-xs" onClick={goJoinArena}>
            {t('ladder.upload.joinArena')}
          </button>
        ) : null}
      </div>

      {statusText ? (
        <div className="space-y-1" role="status">
          <p
            className={`text-sm ${lastResult?.ok && lastResult.updated ? 'text-emerald-400/90' : 'text-zinc-400'}`}
          >
            {statusText}
          </p>
          {quotaSubline ? <p className="text-xs text-zinc-500">{quotaSubline}</p> : null}
        </div>
      ) : null}
    </div>
  );
};

export default LeaderboardUploadBar;
