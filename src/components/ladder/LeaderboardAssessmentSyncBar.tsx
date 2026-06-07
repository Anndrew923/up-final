import { type FC, useEffect, useState } from 'react';
import { shouldShowLadderSyncFeedback } from '../../logic/core/ladderSyncFeedback';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import type { AssessmentLadderUploadBundle } from '../../logic/core/assessmentLadderSupplemental';
import type {
  AssessmentLadderSyncScope,
  LeaderboardSyncTarget,
} from '../../logic/core/leaderboardSyncTargets';
import { navigateFromUiGate } from '../../lib/uiGateNavigation';
import { gateSheetKindFromUiGate } from '../../lib/uiGatePresentation';
import { useUiGate } from '../../hooks/useUiGate';
import type { AssessmentLadderSyncController } from '../../hooks/useLeaderboardSyncAssessmentPage';
import LeaderboardGateSheet from './LeaderboardGateSheet';
import LadderInfoSheet from './LadderInfoSheet';
import LadderCallableWriteModeBadge from './LadderCallableWriteModeBadge';
import LadderSyncSummaryStatus from './LadderSyncSummaryStatus';

export interface LeaderboardAssessmentSyncBarProps {
  scope: AssessmentLadderSyncScope;
  uploadBundle?: AssessmentLadderUploadBundle | null;
  /** @deprecated Prefer `uploadBundle`. */
  supplementalTargets?: LeaderboardSyncTarget[];
  /** Shares ladder state with breakthrough modal — one hook instance per assessment page. */
  syncController: AssessmentLadderSyncController;
  className?: string;
}

/**
 * Single control that uploads every ladder shard owned by the current assessment page.
 */
const LeaderboardAssessmentSyncBar: FC<LeaderboardAssessmentSyncBarProps> = ({
  scope,
  uploadBundle,
  supplementalTargets,
  syncController,
  className,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const uiGate = useUiGate('ladder-upload');
  const [infoOpen, setInfoOpen] = useState(false);
  const [gateSheetOpen, setGateSheetOpen] = useState(false);
  const [tapHint, setTapHint] = useState<'no-targets' | null>(null);
  const { syncPage, busy, summary, failures, gate, targetCount, goJoinArena, clearFeedback } =
    syncController;

  const disabled = busy;
  const showSyncFeedback = shouldShowLadderSyncFeedback(summary, failures);
  const gateSheetKind = gateSheetKindFromUiGate(uiGate);

  useEffect(() => {
    setTapHint(null);
  }, [targetCount, gate, scope, uploadBundle, supplementalTargets]);

  return (
    <div className={`relative space-y-2 border-t border-zinc-800/80 pt-4 ${className ?? ''}`}>
      <div className="absolute right-0 top-0 z-10 max-w-[55%] sm:max-w-none">
        <LadderCallableWriteModeBadge />
      </div>

      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {t('ladder.upload.sectionTitle')}
      </p>
      <p className="text-xs leading-relaxed text-zinc-500">{t('ladder.assessmentSync.hint')}</p>

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
            if (gate !== 'ok') {
              if (gateSheetKind) setGateSheetOpen(true);
              return;
            }
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
      {gateSheetKind ? (
        <LeaderboardGateSheet
          open={gateSheetOpen}
          kind={gateSheetKind}
          description={t(`ladder.gateSheet.${gateSheetKind}.body`)}
          secondaryLabel={t('gateSheet.secondary')}
          onSecondary={() => setGateSheetOpen(false)}
          onPrimary={() => {
            setGateSheetOpen(false);
            navigateFromUiGate(navigate, uiGate, ROUTES.ladder);
          }}
        />
      ) : null}

      {showSyncFeedback && summary ? (
        <LadderSyncSummaryStatus summary={summary} failures={failures} />
      ) : null}
    </div>
  );
};

export default LeaderboardAssessmentSyncBar;
