import { type FC, useEffect, useState } from 'react';
import { shouldShowLadderSyncFeedback } from '../../logic/core/ladderSyncFeedback';
import { useTranslation } from 'react-i18next';
import type { AssessmentLadderSyncController } from '../../hooks/useLeaderboardSyncAssessmentPage';
import { useLadderUploadGateSheet } from '../../hooks/useLadderUploadGateSheet';
import { useLadderIdentityUploadGate } from '../../hooks/useLadderIdentityUploadGate';
import { ROUTES } from '../../config/routes';
import LadderUploadGateSheetPortal from './LadderUploadGateSheetPortal';
import LadderIdentitySheet from './LadderIdentitySheet';
import LadderIdentityChip from './LadderIdentityChip';
import LadderSyncSummaryStatus from './LadderSyncSummaryStatus';

export interface LeaderboardAssessmentSyncBarProps {
  /** Shares ladder state with breakthrough modal — one hook instance per assessment page. */
  syncController: AssessmentLadderSyncController;
  className?: string;
}

/**
 * Compact Sync Capsule for assessment pages: sync CTA + identity chip on one row.
 * WHY: Strip DEV/write-mode chrome and always-on copy so the radar CTA pair stays the
 * visual primary; ladder sync remains one glanceable action when gate + identity are ready.
 */
const LeaderboardAssessmentSyncBar: FC<LeaderboardAssessmentSyncBarProps> = ({
  syncController,
  className,
}) => {
  const { t } = useTranslation('common');
  const gateSheet = useLadderUploadGateSheet(ROUTES.ladder);
  const {
    identity,
    identitySheetOpen,
    openIdentitySheet,
    closeIdentitySheet,
    ensureIdentityReady,
  } = useLadderIdentityUploadGate();
  const [tapHint, setTapHint] = useState<'no-targets' | null>(null);
  const { syncPage, busy, summary, failures, gate, targetCount, goJoinArena, clearFeedback } =
    syncController;

  const disabled = busy;
  const showSyncFeedback = shouldShowLadderSyncFeedback(summary, failures);
  /** Ready path: capsule only — no gate / identity prose competing with the avatar chip. */
  const showReadyCapsule = gate === 'ok' && identity.ready;
  const statusCopy =
    targetCount === 0
      ? t('ladder.assessmentSync.noTargets')
      : gate !== 'ok'
        ? t(`ladder.upload.gate.${gate}`)
        : !identity.ready
          ? t('ladder.syncAll.identityRequiredHint')
          : null;

  useEffect(() => {
    setTapHint(null);
  }, [targetCount, gate]);

  return (
    <div className={`relative space-y-2 border-t border-zinc-800/80 pt-4 ${className ?? ''}`}>
      {statusCopy ? (
        <p className="text-xs leading-relaxed text-zinc-500">{statusCopy}</p>
      ) : null}

      {tapHint === 'no-targets' ? (
        <p className="text-sm text-amber-400/90" role="status">
          {t('ladder.assessmentSync.noTargetsTap')}
        </p>
      ) : null}

      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            className="ui-btn border-accent-primary/40 text-accent-primary"
            disabled={disabled}
            onClick={() => {
              setTapHint(null);
              if (targetCount === 0) {
                setTapHint('no-targets');
                return;
              }
              if (gateSheet.tryOpenGateSheet(gate)) return;
              // WHY: Hard name gate on assessment pages too — same ghost-nickname leak path.
              if (!ensureIdentityReady()) return;
              clearFeedback();
              void syncPage();
            }}
          >
            {busy
              ? t('ladder.assessmentSync.busy')
              : identity.ready
                ? t('ladder.assessmentSync.button')
                : t('ladder.syncAll.buttonSetupIdentity')}
          </button>
          {gate === 'pro' ? (
            <button type="button" className="ui-btn text-xs" onClick={goJoinArena}>
              {t('ladder.upload.joinArena')}
            </button>
          ) : null}
        </div>
        {showReadyCapsule ? (
          <LadderIdentityChip
            identity={identity}
            onClick={openIdentitySheet}
            className="shrink-0"
          />
        ) : null}
      </div>

      <LadderIdentitySheet open={identitySheetOpen} onClose={closeIdentitySheet} />

      <LadderUploadGateSheetPortal
        gateSheetKind={gateSheet.gateSheetKind}
        open={gateSheet.gateSheetOpen}
        onClose={gateSheet.closeGateSheet}
        onConfirm={gateSheet.confirmGateSheet}
      />

      {showSyncFeedback && summary ? (
        <LadderSyncSummaryStatus summary={summary} failures={failures} variant="assessment" />
      ) : null}
    </div>
  );
};

export default LeaderboardAssessmentSyncBar;
