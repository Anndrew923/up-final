import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  AssessmentLadderSyncScope,
  LeaderboardSyncTarget,
} from '../../logic/core/leaderboardSyncTargets';
import { useLeaderboardSyncAssessmentPage } from '../../hooks/useLeaderboardSyncAssessmentPage';
import LadderInfoSheet from './LadderInfoSheet';

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
  const [infoOpen, setInfoOpen] = useState(false);
  const { syncPage, busy, summary, gate, targetCount, goJoinArena, clearFeedback } =
    useLeaderboardSyncAssessmentPage({
      scope,
      supplementalTargets,
      onFinished,
    });

  const disabled = gate !== 'ok' || busy || targetCount === 0;

  return (
    <div className={`space-y-2 border-t border-zinc-800/80 pt-4 ${className ?? ''}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {t('ladder.upload.sectionTitle')}
      </p>
      <p className="text-xs leading-relaxed text-zinc-500">{t('ladder.assessmentSync.hint')}</p>

      {targetCount === 0 ? (
        <p className="text-xs leading-relaxed text-zinc-500">{t('ladder.assessmentSync.noTargets')}</p>
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

      {summary && summary.attempted > 0 ? (
        <p className="text-sm text-zinc-400" role="status">
          {t('ladder.syncAll.summary', {
            attempted: summary.attempted,
            updated: summary.updated,
            errors: summary.errors,
            rateLimited: summary.rateLimited,
            proRequired: summary.proRequired,
          })}
        </p>
      ) : null}
    </div>
  );
};

export default LeaderboardAssessmentSyncBar;
