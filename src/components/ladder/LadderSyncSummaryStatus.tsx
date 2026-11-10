import { type FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  hasAvatarUploadSyncFailure,
  LADDER_SYNC_HUD_AUTO_DISMISS_MS,
  LADDER_SYNC_HUD_FADE_MS,
  resolveLadderSyncHudCopy,
} from '../../logic/core/ladderSyncFeedback';
import type {
  LadderSyncShardFailure,
  LeaderboardSyncRunSummary,
} from '../../logic/core/leaderboardSyncTargets';

export interface LadderSyncSummaryStatusProps {
  summary: LeaderboardSyncRunSummary;
  failures?: LadderSyncShardFailure[];
  /** Assessment page batch — clearer success copy when shards + overall were coupled. */
  variant?: 'syncAll' | 'assessment';
  /** Live composite score for success HUD (optional). */
  currentLadderScore?: number | null;
  /** Fired after auto-fade window — parent should clear summary state. */
  onAutoDismiss?: () => void;
  className?: string;
}

/**
 * Competitive HUD for batch sync — result-oriented copy, auto-fade.
 * WHY: Shard tallies ("processed N shards") read as debug logs on the console.
 */
const LadderSyncSummaryStatus: FC<LadderSyncSummaryStatusProps> = ({
  summary,
  failures = [],
  variant = 'syncAll',
  currentLadderScore = null,
  onAutoDismiss,
  className,
}) => {
  const { t } = useTranslation('common');
  const [fading, setFading] = useState(false);

  const avatarBlocked = summary.attempted === 0 && hasAvatarUploadSyncFailure(failures);
  const avatarSoftFail = summary.attempted > 0 && hasAvatarUploadSyncFailure(failures);
  const identityOnlySuccess =
    summary.updated === 0 &&
    (summary.identityPatched ?? 0) > 0 &&
    (summary.avatarPatched ?? 0) === 0 &&
    !avatarBlocked;
  const avatarOnlySuccess =
    summary.updated === 0 && (summary.avatarPatched ?? 0) > 0 && !avatarBlocked;

  const hud = resolveLadderSyncHudCopy(summary, { currentLadderScore });

  useEffect(() => {
    if (!onAutoDismiss) return;
    setFading(false);
    const fadeAt = window.setTimeout(() => {
      setFading(true);
    }, Math.max(0, LADDER_SYNC_HUD_AUTO_DISMISS_MS - LADDER_SYNC_HUD_FADE_MS));
    const dismissAt = window.setTimeout(() => {
      onAutoDismiss();
    }, LADDER_SYNC_HUD_AUTO_DISMISS_MS);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(dismissAt);
    };
  }, [summary, failures, onAutoDismiss, currentLadderScore]);

  let statusText: string | null = null;
  let tone = 'text-zinc-400';

  // Priority: avatar preflight → identity/portrait-only soft wins → batch HUD →
  // avatar soft-fail only when score path did not already succeed (don't mask a live write).
  if (avatarBlocked) {
    statusText = t('ladder.upload.resultAvatarUploadFailed');
    tone = 'text-amber-400/90';
  } else if (avatarOnlySuccess) {
    statusText = t('ladder.syncAll.avatarPortraitUpdated');
    tone = 'text-emerald-400/90';
  } else if (identityOnlySuccess) {
    statusText = t('ladder.syncAll.identityPatched');
    tone = 'text-emerald-400/90';
  } else if (hud.kind === 'error') {
    statusText = t('ladder.syncAll.hudError');
    tone = 'text-amber-400/90';
  } else if (hud.kind === 'success-with-score') {
    statusText = t('ladder.syncAll.hudSuccessWithScore', { score: hud.scoreLabel });
    tone = 'text-emerald-400/90';
  } else if (hud.kind === 'success') {
    statusText =
      variant === 'assessment'
        ? t('ladder.assessmentSync.successSummary')
        : t('ladder.syncAll.hudSuccess');
    tone = 'text-emerald-400/90';
  } else if (avatarSoftFail) {
    statusText = t('ladder.upload.resultAvatarUploadFailed');
    tone = 'text-amber-400/90';
  } else if (hud.kind === 'ready') {
    statusText = t('ladder.syncAll.hudReady');
    tone = 'text-zinc-300';
  } else if (failures.length > 0) {
    statusText = t('ladder.syncAll.hudError');
    tone = 'text-amber-400/90';
  }

  if (!statusText) return null;

  return (
    <div
      className={`transition-opacity duration-700 ease-out ${fading ? 'opacity-0' : 'opacity-100'} ${className ?? ''}`}
      aria-live="polite"
    >
      <p className={`text-sm leading-snug ${tone}`} role="status">
        {statusText}
      </p>
    </div>
  );
};

export default LadderSyncSummaryStatus;
