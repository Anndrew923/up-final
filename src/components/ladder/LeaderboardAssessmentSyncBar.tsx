import { type FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import type {
  AssessmentLadderSyncScope,
  LeaderboardSyncTarget,
} from '../../logic/core/leaderboardSyncTargets';
import { useLeaderboardSyncAssessmentPage } from '../../hooks/useLeaderboardSyncAssessmentPage';
import LeaderboardGateSheet from './LeaderboardGateSheet';
import LadderInfoSheet from './LadderInfoSheet';
import LadderCallableWriteModeBadge from './LadderCallableWriteModeBadge';
import LadderSyncSummaryStatus from './LadderSyncSummaryStatus';

export interface LeaderboardAssessmentSyncBarProps {
  scope: AssessmentLadderSyncScope;
  supplementalTargets?: LeaderboardSyncTarget[];
  onFinished?: () => void;
  className?: string;
}

/**
 * Single control that uploads every ladder shard owned by the current assessment page.
 */
const LeaderboardAssessmentSyncBar: FC<LeaderboardAssessmentSyncBarProps> = ({
  scope,
  supplementalTargets,
  onFinished,
  className,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(false);
  const [gateSheetOpen, setGateSheetOpen] = useState(false);
  const { syncPage, busy, summary, failures, gate, targetCount, goJoinArena, clearFeedback } =
    useLeaderboardSyncAssessmentPage({
      scope,
      supplementalTargets,
      onFinished,
    });

  const disabled = busy || targetCount === 0;
  const gateSheetCopy = useMemo(() => {
    if (gate === 'signed-out' || gate === 'anonymous') {
      return {
        title: t('ladder.gateSheet.auth.title'),
        body: t('ladder.gateSheet.auth.body'),
        primary: t('ladder.gateSheet.auth.primary'),
        nextRoute: ROUTES.authChoice,
      };
    }
    if (gate === 'no-pro') {
      return {
        title: t('ladder.gateSheet.pro.title'),
        body: t('ladder.gateSheet.pro.body'),
        primary: t('ladder.gateSheet.pro.primary'),
        nextRoute: ROUTES.joinArena,
      };
    }
    return null;
  }, [gate, t]);

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
            if (gate !== 'ok') {
              if (gateSheetCopy) setGateSheetOpen(true);
              return;
            }
            clearFeedback();
            void syncPage();
          }}
        >
          {busy ? t('ladder.assessmentSync.busy') : t('ladder.assessmentSync.button')}
        </button>
        {gate === 'no-pro' ? (
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
      {gateSheetCopy ? (
        <LeaderboardGateSheet
          open={gateSheetOpen}
          title={gateSheetCopy.title}
          description={gateSheetCopy.body}
          primaryLabel={gateSheetCopy.primary}
          secondaryLabel={t('ladder.gateSheet.secondary')}
          onSecondary={() => setGateSheetOpen(false)}
          onPrimary={() => {
            setGateSheetOpen(false);
            if (gateSheetCopy.nextRoute === ROUTES.joinArena) {
              goJoinArena();
              return;
            }
            navigate(gateSheetCopy.nextRoute, { state: { returnTo: ROUTES.ladder } });
          }}
        />
      ) : null}

      {summary && summary.attempted > 0 ? (
        <LadderSyncSummaryStatus summary={summary} failures={failures} />
      ) : null}
    </div>
  );
};

export default LeaderboardAssessmentSyncBar;
