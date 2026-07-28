import { type FC, useEffect, useMemo, useState } from 'react';
import { shouldShowLadderSyncFeedback } from '../../logic/core/ladderSyncFeedback';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { formatRateLimitResetAt } from '../../lib/formatRateLimitResetAt';
import { navigateFromUiGate } from '../../lib/uiGateNavigation';
import { gateSheetKindFromUiGate } from '../../lib/uiGatePresentation';
import { useUiGate } from '../../hooks/useUiGate';
import { useLeaderboardSyncAll } from '../../hooks/useLeaderboardSyncAll';
import { useLadderIdentityReady } from '../../hooks/useLadderIdentityReady';
import LeaderboardGateSheet from './LeaderboardGateSheet';
import LadderIdentitySheet from './LadderIdentitySheet';
import LadderIdentityChip from './LadderIdentityChip';
import LadderSyncSummaryStatus from './LadderSyncSummaryStatus';

export interface LeaderboardSyncAllBarProps {
  /** Called after a full pass completes (e.g. bump ladder fetch nonce). */
  onFinished?: () => void;
  className?: string;
  /** When true, shows the shared ladder upload section kicker (e.g. ladder filter sheet). */
  showSectionTitle?: boolean;
}

/**
 * Compact Sync Capsule for Home CONSOLE + Ladder full-sync.
 * WHY: Match assessment Sync Capsule — no always-on gate/DEV chrome; click opens
 * Gate Sheet / Identity Sheet / cooldown·no-targets hints.
 */
const LeaderboardSyncAllBar: FC<LeaderboardSyncAllBarProps> = ({
  onFinished,
  className,
  showSectionTitle = false,
}) => {
  const { t, i18n } = useTranslation('common');
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const navigate = useNavigate();
  const uiGate = useUiGate('ladder-upload');
  const identity = useLadderIdentityReady();
  const [gateSheetOpen, setGateSheetOpen] = useState(false);
  const [identitySheetOpen, setIdentitySheetOpen] = useState(false);
  const [tapHint, setTapHint] = useState<'no-targets' | 'cooldown' | 'gate' | null>(null);
  const { syncAll, busy, summary, failures, fullSyncBlock, gate, targetCount, goJoinArena, clearFeedback } =
    useLeaderboardSyncAll({
      onFinished,
    });

  const fullSyncBlocked = Boolean(fullSyncBlock && !fullSyncBlock.allowed);
  const disabled = busy;
  const showSyncFeedback = shouldShowLadderSyncFeedback(summary, failures);
  const gateSheetKind = gateSheetKindFromUiGate(uiGate);
  const showReadyCapsule = gate === 'ok' && identity.ready;

  useEffect(() => {
    setTapHint(null);
  }, [targetCount, gate, fullSyncBlocked]);

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

  const runSyncOrIdentityGate = () => {
    setTapHint(null);
    if (fullSyncBlocked) {
      setTapHint('cooldown');
      return;
    }
    if (targetCount === 0) {
      setTapHint('no-targets');
      return;
    }
    if (gate !== 'ok') {
      if (gateSheetKind) {
        setGateSheetOpen(true);
        return;
      }
      // WHY: no-score / invalid-score have no sheet — surface tap hint instead of a silent no-op.
      setTapHint('gate');
      return;
    }
    // WHY: Name is the hard upload gate — open the drawer in-place; never navigate away from radar.
    if (!identity.ready) {
      setIdentitySheetOpen(true);
      return;
    }
    clearFeedback();
    void syncAll();
  };

  return (
    <div
      className={`space-y-2 border-t border-zinc-800/80 ${showSectionTitle ? 'pt-4' : 'pt-2'} ${className ?? ''}`}
    >
      {showSectionTitle ? (
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {t('ladder.syncAll.sectionTitle')}
        </p>
      ) : null}

      {tapHint === 'no-targets' ? (
        <p className="text-sm text-amber-400/90" role="status">
          {t('ladder.syncAll.noTargets')}
        </p>
      ) : null}
      {tapHint === 'cooldown' && fullSyncBlockText ? (
        <p className="text-sm text-amber-400/90" role="status">
          {fullSyncBlockText}
        </p>
      ) : null}
      {tapHint === 'gate' ? (
        <p className="text-sm text-amber-400/90" role="status">
          {t(`ladder.upload.gate.${gate}`)}
        </p>
      ) : null}

      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            className="ui-btn border-accent-primary/40 text-accent-primary"
            disabled={disabled}
            onClick={runSyncOrIdentityGate}
          >
            {busy
              ? t('ladder.syncAll.busy')
              : identity.ready
                ? t('ladder.syncAll.button')
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
            onClick={() => setIdentitySheetOpen(true)}
            className="shrink-0"
          />
        ) : null}
      </div>

      <LadderIdentitySheet
        open={identitySheetOpen}
        onClose={() => setIdentitySheetOpen(false)}
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

export default LeaderboardSyncAllBar;
