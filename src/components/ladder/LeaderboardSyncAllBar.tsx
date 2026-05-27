import { type FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { useLeaderboardSyncAll } from '../../hooks/useLeaderboardSyncAll';
import { LEADERBOARD_UPLOADS_PER_HOUR } from '../../logic/core/ladderUploadPolicy';
import LeaderboardGateSheet from './LeaderboardGateSheet';
import LadderInfoSheet from './LadderInfoSheet';

export interface LeaderboardSyncAllBarProps {
  /** Called after a full pass completes (e.g. bump ladder fetch nonce). */
  onFinished?: () => void;
  className?: string;
  /** When true, shows the shared ladder upload section kicker (e.g. ladder filter sheet). */
  showSectionTitle?: boolean;
}

/**
 * One-shot upload of every shard derived from the merged radar score map + overall.
 */
const LeaderboardSyncAllBar: FC<LeaderboardSyncAllBarProps> = ({
  onFinished,
  className,
  showSectionTitle = false,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(false);
  const [gateSheetOpen, setGateSheetOpen] = useState(false);
  const { syncAll, busy, summary, gate, targetCount, goJoinArena, clearFeedback } =
    useLeaderboardSyncAll({
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

  const quotaModalBody = t('ladder.syncAll.advancedTip', { limit: LEADERBOARD_UPLOADS_PER_HOUR });

  return (
    <div
      className={`space-y-2 border-t border-zinc-800/80 ${showSectionTitle ? 'pt-4' : 'pt-2'} ${className ?? ''}`}
    >
      {showSectionTitle ? (
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {t('ladder.syncAll.sectionTitle')}
        </p>
      ) : null}

      {targetCount === 0 ? (
        <p className="text-xs leading-relaxed text-zinc-500">{t('ladder.syncAll.noTargets')}</p>
      ) : gate !== 'ok' ? (
        <p className="text-xs leading-relaxed text-zinc-500">{t(`ladder.upload.gate.${gate}`)}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/60 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
          aria-label={t('ladder.syncAll.infoButtonAria')}
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
            void syncAll();
          }}
        >
          {busy ? t('ladder.syncAll.busy') : t('ladder.syncAll.button')}
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
        title={t('ladder.syncAll.advancedTitle')}
        body={quotaModalBody}
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
        <p
          className={`text-sm ${
            summary.updated > 0
              ? 'text-emerald-400/90'
              : summary.unchanged === summary.attempted
                ? 'text-zinc-300'
                : 'text-zinc-400'
          }`}
          role="status"
        >
          {t('ladder.syncAll.summary', {
            attempted: summary.attempted,
            updated: summary.updated,
            unchanged: summary.unchanged,
            errors: summary.errors,
            rateLimited: summary.rateLimited,
            proRequired: summary.proRequired,
          })}
        </p>
      ) : null}
    </div>
  );
};

export default LeaderboardSyncAllBar;
