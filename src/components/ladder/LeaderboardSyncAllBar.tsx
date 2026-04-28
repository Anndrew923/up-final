import { type FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { useLeaderboardSyncAll } from '../../hooks/useLeaderboardSyncAll';
import LeaderboardGateSheet from './LeaderboardGateSheet';
import LadderInfoSheet from './LadderInfoSheet';

export interface LeaderboardSyncAllBarProps {
  /** Called after a full pass completes (e.g. bump ladder fetch nonce). */
  onFinished?: () => void;
  className?: string;
}

/**
 * One-shot upload of every shard derived from the merged radar score map + overall.
 */
const LeaderboardSyncAllBar: FC<LeaderboardSyncAllBarProps> = ({ onFinished, className }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(false);
  const [gateSheetOpen, setGateSheetOpen] = useState(false);
  const { syncAll, busy, gate, targetCount, goJoinArena, clearFeedback } = useLeaderboardSyncAll({
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
    <div className={`space-y-2 border-t border-zinc-800/80 pt-2 ${className ?? ''}`}>
      <p className="text-xs leading-relaxed text-zinc-500">{t('ladder.syncAll.hint')}</p>
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
          className="ui-btn border-accent-info/35 text-accent-info"
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
        body={t('ladder.syncAll.advancedTip')}
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
    </div>
  );
};

export default LeaderboardSyncAllBar;
