import { type FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { formatRateLimitResetAt } from '../../lib/formatRateLimitResetAt';
import { useLeaderboardSyncAll } from '../../hooks/useLeaderboardSyncAll';
import { LEADERBOARD_UPLOADS_PER_HOUR } from '../../logic/core/ladderUploadPolicy';
import LeaderboardGateSheet from './LeaderboardGateSheet';
import LadderInfoSheet from './LadderInfoSheet';
import LadderCallableWriteModeBadge from './LadderCallableWriteModeBadge';
import LadderSyncSummaryStatus from './LadderSyncSummaryStatus';

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
  const { t, i18n } = useTranslation('common');
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(false);
  const [gateSheetOpen, setGateSheetOpen] = useState(false);
  const { syncAll, busy, summary, failures, fullSyncBlock, gate, targetCount, goJoinArena, clearFeedback } =
    useLeaderboardSyncAll({
      onFinished,
    });

  const fullSyncBlocked = Boolean(fullSyncBlock && !fullSyncBlock.allowed);
  const disabled = busy || targetCount === 0 || fullSyncBlocked;
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

  const fullSyncBlockText = useMemo(() => {
    if (!fullSyncBlock || fullSyncBlock.allowed) return null;
    const resetTime = formatRateLimitResetAt(fullSyncBlock.nextAllowedAt, locale);
    if (fullSyncBlock.reason === 'full-sync-cooldown') {
      return t('ladder.syncAll.fullSyncCooldown', { resetTime });
    }
    if (fullSyncBlock.reason === 'full-sync-daily-cap') {
      return t('ladder.syncAll.fullSyncDailyCap', { resetTime });
    }
    return null;
  }, [fullSyncBlock, locale, t]);

  return (
    <div
      className={`relative space-y-2 border-t border-zinc-800/80 ${showSectionTitle ? 'pt-4' : 'pt-2'} ${className ?? ''}`}
    >
      <div className="absolute right-0 top-0 z-10 max-w-[55%] sm:max-w-none">
        <LadderCallableWriteModeBadge />
      </div>

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
        variant="syncAll"
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

      {fullSyncBlockText ? (
        <p className="text-sm text-amber-300/90" role="status">
          {fullSyncBlockText}
        </p>
      ) : null}

      {summary && summary.attempted > 0 ? (
        <LadderSyncSummaryStatus summary={summary} failures={failures} />
      ) : null}
    </div>
  );
};

export default LeaderboardSyncAllBar;
