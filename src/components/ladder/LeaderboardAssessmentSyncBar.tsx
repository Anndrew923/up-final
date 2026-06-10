import { type FC, useEffect, useState } from 'react';
import { shouldShowLadderSyncFeedback } from '../../logic/core/ladderSyncFeedback';
import { useTranslation } from 'react-i18next';
import type { AssessmentLadderSyncController } from '../../hooks/useLeaderboardSyncAssessmentPage';
import { useLadderUploadGateSheet } from '../../hooks/useLadderUploadGateSheet';
import { ROUTES } from '../../config/routes';
import LadderUploadGateSheetPortal from './LadderUploadGateSheetPortal';
import LadderInfoSheet from './LadderInfoSheet';
import LadderCallableWriteModeBadge from './LadderCallableWriteModeBadge';
import LadderSyncSummaryStatus from './LadderSyncSummaryStatus';

export interface LeaderboardAssessmentSyncBarProps {
  /** Shares ladder state with breakthrough modal — one hook instance per assessment page. */
  syncController: AssessmentLadderSyncController;
  className?: string;
}

/**
 * Single control that uploads every ladder shard owned by the current assessment page.
 */
const LeaderboardAssessmentSyncBar: FC<LeaderboardAssessmentSyncBarProps> = ({
  syncController,
  className,
}) => {
  const { t } = useTranslation('common');
  const gateSheet = useLadderUploadGateSheet(ROUTES.ladder);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tapHint, setTapHint] = useState<'no-targets' | null>(null);
  const { syncPage, busy, summary, failures, gate, targetCount, goJoinArena, clearFeedback } =
    syncController;

  const disabled = busy;
  const showSyncFeedback = shouldShowLadderSyncFeedback(summary, failures);

  useEffect(() => {
    setTapHint(null);
  }, [targetCount, gate]);

  return (
    <div className={`relative space-y-2 border-t border-zinc-800/80 pt-4 ${className ?? ''}`}>
      <div className="absolute right-0 top-0 z-10 max-w-[55%] sm:max-w-none">
        <LadderCallableWriteModeBadge />
      </div>

      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {t('ladder.upload.sectionTitle')}
      </p>

      {targetCount === 0 ? (
        <p className="text-xs leading-relaxed text-zinc-500">
          {t('ladder.assessmentSync.noTargets')}
        </p>
      ) : gate !== 'ok' ? (
        <p className="text-xs leading-relaxed text-zinc-500">{t(`ladder.upload.gate.${gate}`)}</p>
      ) : null}

      {tapHint === 'no-targets' ? (
        <p className="text-sm text-amber-400/90" role="status">
          {t('ladder.assessmentSync.noTargetsTap')}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/60 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
          aria-label={t('ladder.assessmentSync.infoButtonAria')}
          onClick={() => setInfoOpen(true)}
        >
          ⓘ
        </button>
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
            clearFeedback();
            void syncPage();
          }}
        >
          {busy ? t('ladder.assessmentSync.busy') : t('ladder.assessmentSync.button')}
        </button>
        {gate === 'pro' ? (
          <button type="button" className="ui-btn text-xs" onClick={goJoinArena}>
            {t('ladder.upload.joinArena')}
          </button>
        ) : null}
      </div>
      <LadderInfoSheet
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title={t('ladder.assessmentSync.advancedTitle')}
        body={t('ladder.assessmentSync.advancedTip')}
      />

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
