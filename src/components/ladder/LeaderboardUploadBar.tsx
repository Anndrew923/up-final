import { useEffect, useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import LeaderboardGateSheet from './LeaderboardGateSheet';
import { useTranslation } from 'react-i18next';
import type { LeaderboardShardId } from '../../logic/core/ladderShards';
import { formatRateLimitResetAt } from '../../lib/formatRateLimitResetAt';
import { gateSheetKindFromUiGate } from '../../lib/uiGatePresentation';
import { navigateFromUiGate } from '../../lib/uiGateNavigation';
import { useUiGate } from '../../hooks/useUiGate';
import {
  useLeaderboardUpload,
  resolveLeaderboardUploadGate,
} from '../../hooks/useLeaderboardUpload';
import { LEADERBOARD_UPLOADS_PER_HOUR } from '../../logic/core/ladderUploadPolicy';
import { useAuthStore } from '../../stores/authStore';
import { useEntitlementStore } from '../../stores/entitlementStore';
import { useShallow } from 'zustand/react/shallow';
import { selectEntitlementState } from '../../stores/entitlementSelectors';

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
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const navigate = useNavigate();
  const authStatus = useAuthStore((state) => state.status);
  const isAnonymous = useAuthStore((state) => state.isAnonymous);
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const uiGate = useUiGate('ladder-upload');

  const gate = useMemo(
    () => resolveLeaderboardUploadGate(score, entitlement, authStatus, isAnonymous),
    [score, entitlement, authStatus, isAnonymous]
  );

  const { upload, busy, lastResult, goJoinArena, clearFeedback } = useLeaderboardUpload();
  const [gateSheetOpen, setGateSheetOpen] = useState(false);

  useEffect(() => {
    clearFeedback();
  }, [metric, score, showSectionTitle, clearFeedback]);

  const disabled =
    busy || !Number.isFinite(score ?? NaN) || gate === 'no-score' || gate === 'invalid-score';

  const statusText = (() => {
    if (!lastResult) return null;
    if (lastResult.reason === 'unchanged') {
      return t('ladder.upload.resultUnchanged');
    }
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
    if (lastResult.reason === 'avatar-upload-failed') {
      return t('ladder.upload.resultAvatarUploadFailed');
    }
    return t('ladder.upload.resultError');
  })();

  const quotaSubline = (() => {
    if (!lastResult?.ok || lastResult.rateLimitResetAt == null) return null;
    const args = {
      remaining: lastResult.rateLimitRemaining ?? 0,
      limit: lastResult.limitPerHour ?? LEADERBOARD_UPLOADS_PER_HOUR,
      resetTime: formatRateLimitResetAt(lastResult.rateLimitResetAt, locale),
    };
    if (lastResult.reason === 'unchanged') {
      return t('ladder.upload.quotaAfterUnchanged', args);
    }
    if (lastResult.updated) {
      return t('ladder.upload.quotaAfterSuccess', args);
    }
    return null;
  })();

  const gateSheetKind = gateSheetKindFromUiGate(uiGate);
  const gateDescription =
    gateSheetKind != null ? t(`ladder.gateSheet.${gateSheetKind}.body`) : '';

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
            if (gate !== 'ok') {
              if (gateSheetKind) setGateSheetOpen(true);
              return;
            }
            if (score != null && Number.isFinite(score)) {
              void upload(metric, score);
            }
          }}
        >
          {busy ? t('ladder.upload.uploading') : t('ladder.upload.button')}
        </button>
        {gate === 'pro' ? (
          <button type="button" className="ui-btn text-xs" onClick={goJoinArena}>
            {t('ladder.upload.joinArena')}
          </button>
        ) : null}
      </div>

      {statusText ? (
        <div className="space-y-1" role="status">
          <p
            className={`text-sm ${
              lastResult?.ok && (lastResult.updated || lastResult.reason === 'unchanged')
                ? lastResult.updated
                  ? 'text-emerald-400/90'
                  : 'text-zinc-300'
                : 'text-zinc-400'
            }`}
          >
            {statusText}
          </p>
          {quotaSubline ? <p className="text-xs text-zinc-500">{quotaSubline}</p> : null}
        </div>
      ) : null}
      {gateSheetKind ? (
        <LeaderboardGateSheet
          open={gateSheetOpen}
          kind={gateSheetKind}
          description={gateDescription}
          secondaryLabel={t('gateSheet.secondary')}
          onSecondary={() => setGateSheetOpen(false)}
          onPrimary={() => {
            setGateSheetOpen(false);
            navigateFromUiGate(navigate, uiGate, ROUTES.ladder);
          }}
        />
      ) : null}
    </div>
  );
};

export default LeaderboardUploadBar;
