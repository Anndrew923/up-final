import { useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useLeaderboardAccess } from '../../hooks/useLeaderboardAccess';
import { useLeaderboardSyncAll } from '../../hooks/useLeaderboardSyncAll';
import { useLadderIdentityReady } from '../../hooks/useLadderIdentityReady';
import { shouldShowLadderSyncFeedback } from '../../logic/core/ladderSyncFeedback';
import LadderIdentitySheet from './LadderIdentitySheet';
import LadderSyncSummaryStatus from './LadderSyncSummaryStatus';

export interface LadderTagsSyncOfferProps {
  /**
   * Only fires after a successful sync write (updated / identity / avatar patch).
   * WHY: Failures must not close the parent sheet or burn dismiss flags.
   */
  onSynced?: () => void;
  /** Secondary dismiss for prompt-sheet phase (continue without syncing). */
  onContinueWithoutSync?: () => void;
}

/**
 * Soft Local→Cloud offer after ladder tags are saved locally.
 * WHY: Filtered ranks read shard fields; Save Tags alone never hits Firestore.
 */
const LadderTagsSyncOffer: FC<LadderTagsSyncOfferProps> = ({
  onSynced,
  onContinueWithoutSync,
}) => {
  const { t } = useTranslation('common');
  const { canEnter } = useLeaderboardAccess();
  const identity = useLadderIdentityReady();
  const [identitySheetOpen, setIdentitySheetOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const handledSummaryRef = useRef<string | null>(null);
  const { syncAll, busy, gate, summary, failures, fullSyncBlock, targetCount, clearFeedback } =
    useLeaderboardSyncAll();

  // WHY: Resolve success/failure from summary — never treat "finished running" as synced.
  useEffect(() => {
    if (!summary) return;
    const key = `${summary.attempted}:${summary.updated}:${summary.unchanged}:${failures.length}`;
    if (handledSummaryRef.current === key) return;
    handledSummaryRef.current = key;

    const wroteSomething =
      summary.updated > 0 ||
      (summary.identityPatched ?? 0) > 0 ||
      (summary.avatarPatched ?? 0) > 0;

    if (wroteSomething) {
      setHint(null);
      onSynced?.();
      return;
    }
    if (failures.length > 0) {
      setHint(t('ladder.tagsSync.syncFailed'));
      return;
    }
    setHint(t('ladder.tagsSync.syncNoOp'));
  }, [summary, failures, onSynced, t]);

  if (!canEnter) {
    if (!onContinueWithoutSync) return null;
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-emerald-300/95" role="status">
          {t('home.profile.saved')}
        </p>
        <button
          type="button"
          className="ui-btn ui-btn-primary w-full text-sm"
          onClick={onContinueWithoutSync}
        >
          {t('ladder.tagsSync.continueWithoutSync')}
        </button>
      </div>
    );
  }

  const showFeedback = shouldShowLadderSyncFeedback(summary, failures);

  const handleSync = () => {
    setHint(null);
    handledSummaryRef.current = null;
    clearFeedback();
    if (gate !== 'ok') {
      setHint(t(`ladder.upload.gate.${gate}`));
      return;
    }
    if (targetCount === 0) {
      setHint(t('ladder.syncAll.noTargets'));
      return;
    }
    if (fullSyncBlock && !fullSyncBlock.allowed) {
      setHint(t('ladder.tagsSync.rateLimited'));
      return;
    }
    if (!identity.ready) {
      setIdentitySheetOpen(true);
      return;
    }
    void syncAll();
  };

  return (
    <div className="space-y-3">
      {hint ? (
        <p className="text-xs text-amber-300/90" role="status">
          {hint}
        </p>
      ) : null}
      {showFeedback && summary ? (
        <LadderSyncSummaryStatus summary={summary} failures={failures} variant="syncAll" />
      ) : null}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="ui-btn ui-btn-primary w-full text-sm"
          disabled={busy}
          onClick={handleSync}
        >
          {busy ? t('ladder.syncAll.busy') : t('ladder.tagsSync.syncCta')}
        </button>
        {onContinueWithoutSync ? (
          <button
            type="button"
            className="min-h-11 w-full rounded-xl border border-zinc-600 bg-transparent px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-800/80"
            disabled={busy}
            onClick={onContinueWithoutSync}
          >
            {t('ladder.tagsSync.continueWithoutSync')}
          </button>
        ) : null}
      </div>
      <LadderIdentitySheet
        open={identitySheetOpen}
        onClose={() => setIdentitySheetOpen(false)}
        onSaved={() => {
          setIdentitySheetOpen(false);
          handledSummaryRef.current = null;
          void syncAll();
        }}
      />
    </div>
  );
};

export default LadderTagsSyncOffer;
