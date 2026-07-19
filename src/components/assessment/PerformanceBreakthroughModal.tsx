import { useCallback, useEffect, useId, useRef, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { ROUTES } from '../../config/routes';
import type { PerformanceBreakthroughPayload } from '../../logic/core/performanceBreakthrough';
import { resolveBreakthroughArenaPipelineBanner } from '../../logic/core/breakthroughArenaPipeline';
import { shouldShowLadderSyncFeedback } from '../../logic/core/ladderSyncFeedback';
import { waitForReactSettlement } from '../../lib/reactSettlement';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import type { AssessmentLadderSyncController } from '../../hooks/useLeaderboardSyncAssessmentPage';
import { useLadderUploadGateSheet } from '../../hooks/useLadderUploadGateSheet';
import LadderUploadGateSheetPortal from '../ladder/LadderUploadGateSheetPortal';
import LadderSyncSummaryStatus from '../ladder/LadderSyncSummaryStatus';
import AuraReactiveFrame from './AuraReactiveFrame';
import TachometerMilestoneBar from './TachometerMilestoneBar';

export interface PerformanceBreakthroughModalProps {
  open: boolean;
  payload: PerformanceBreakthroughPayload | null;
  onClose: () => void;
  /** Button 1: persist + navigate home. */
  onSyncToDashboard?: () => void | Promise<void>;
  /** Button 2 step 1: persist only — no navigation. */
  onPersistToDashboard?: () => boolean | Promise<boolean>;
  syncDisabled?: boolean;
  syncing?: boolean;
  /** Button 2 step 2: Route A coupled ladder sync (shares controller with page sync bar). */
  arenaSync?: AssessmentLadderSyncController;
}

const PerformanceBreakthroughModal: FC<PerformanceBreakthroughModalProps> = ({
  open,
  payload,
  onClose,
  onSyncToDashboard,
  onPersistToDashboard,
  syncDisabled = false,
  syncing = false,
  arenaSync,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const arenaSyncRef = useRef(arenaSync);
  arenaSyncRef.current = arenaSync;
  const [syncPending, setSyncPending] = useState(false);
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [dashboardPersistedInSession, setDashboardPersistedInSession] = useState(false);
  const {
    gateSheetOpen,
    gateSheetKind,
    tryOpenGateSheet,
    closeGateSheet,
    confirmGateSheet,
    resetGateSheet,
  } = useLadderUploadGateSheet(ROUTES.ladder);
  useFocusTrap(dialogRef, open);

  const isDashboardSyncing = syncing || syncPending;
  const isArenaSyncing = arenaSync?.busy ?? false;
  const isPipelineRunning = pipelineBusy || isArenaSyncing;
  const showDashboardThenArena = onPersistToDashboard != null && arenaSync != null;
  const showDashboardSync = onSyncToDashboard != null;
  const showArenaFeedback = shouldShowLadderSyncFeedback(
    arenaSync?.summary ?? null,
    arenaSync?.failures ?? []
  );
  const pipelineBanner = resolveBreakthroughArenaPipelineBanner(
    dashboardPersistedInSession,
    arenaSync?.summary
  );

  const handleDashboardSync = useCallback(async () => {
    if (!onSyncToDashboard || isDashboardSyncing || isPipelineRunning) return;
    setSyncPending(true);
    try {
      await onSyncToDashboard();
    } finally {
      setSyncPending(false);
    }
  }, [isDashboardSyncing, isPipelineRunning, onSyncToDashboard]);

  const handleDashboardThenArena = useCallback(async () => {
    if (!onPersistToDashboard || !arenaSync || isDashboardSyncing || isPipelineRunning) return;
    if (arenaSync.targetCount === 0) return;
    if (tryOpenGateSheet(arenaSync.gate)) return;

    setPipelineBusy(true);
    setDashboardPersistedInSession(false);
    arenaSync.clearFeedback();

    try {
      const persisted = await Promise.resolve(onPersistToDashboard());
      if (!persisted) return;

      setDashboardPersistedInSession(true);
      await waitForReactSettlement();

      const sync = arenaSyncRef.current;
      if (!sync) return;
      await sync.syncPage();
    } finally {
      setPipelineBusy(false);
    }
  }, [arenaSync, isDashboardSyncing, isPipelineRunning, onPersistToDashboard, tryOpenGateSheet]);

  useEffect(() => {
    if (!open) {
      const id = window.setTimeout(() => {
        setSyncPending(false);
        setPipelineBusy(false);
        setDashboardPersistedInSession(false);
        resetGateSheet();
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [open, resetGateSheet]);

  useShellScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !payload || typeof document === 'undefined') return null;

  const hasActions = showDashboardSync || showDashboardThenArena;
  const actionsBusy = isDashboardSyncing || isPipelineRunning;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.performanceBreakthroughModal} flex items-center justify-center px-4`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label={t('assessment.breakthrough.closeAria')}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md motion-reduce:animate-none animate-breakthrough-enter will-change-[transform,opacity]"
        onClick={(event) => event.stopPropagation()}
      >
        <AuraReactiveFrame auraKey={payload.auraKey}>
          <header className="space-y-2 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-500">
              {t('assessment.breakthrough.kicker')}
            </p>
            <h2 id={titleId} className="text-xl font-bold tracking-tight text-zinc-50">
              {payload.title}
            </h2>
            <p className={`font-mono text-4xl font-bold tabular-nums text-aura-neon text-zinc-50`}>
              {payload.scoreDisplay}
            </p>
          </header>

          <p className="mt-4 text-center text-sm leading-relaxed text-zinc-300">
            {payload.summary}
          </p>

          <div className="mt-6 border-t border-zinc-800/90 pt-5">
            <TachometerMilestoneBar
              progress01={payload.milestone.progress01}
              remainingPoints={payload.milestone.remainingPoints}
              auraKey={payload.auraKey}
            />
          </div>

          {hasActions ? (
            <div className="mt-6 w-full">
              {showDashboardSync ? (
                <button
                  type="button"
                  className="w-full rounded-xl bg-amber-500 py-3 text-sm font-medium text-black transition-all duration-200 hover:bg-amber-400 disabled:pointer-events-none disabled:opacity-40"
                  disabled={syncDisabled || actionsBusy}
                  onClick={() => void handleDashboardSync()}
                >
                  {isDashboardSyncing
                    ? t('assessment.breakthrough.syncing')
                    : t('assessment.breakthrough.syncBtn')}
                </button>
              ) : null}

              {showDashboardThenArena ? (
                <button
                  type="button"
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium tracking-tight text-zinc-200 transition-all duration-200 hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40"
                  disabled={
                    syncDisabled ||
                    actionsBusy ||
                    arenaSync.targetCount === 0 ||
                    arenaSync.gate === 'no-score' ||
                    arenaSync.gate === 'invalid-score'
                  }
                  onClick={() => void handleDashboardThenArena()}
                >
                  {isPipelineRunning
                    ? t('assessment.breakthrough.syncDashboardThenArenaBusy')
                    : t('assessment.breakthrough.syncDashboardThenArena')}
                </button>
              ) : null}

              {pipelineBanner !== 'none' ? (
                <p
                  className={`mt-3 text-sm ${
                    pipelineBanner === 'full-success' ? 'text-emerald-400/90' : 'text-amber-300/90'
                  }`}
                  role="status"
                >
                  {pipelineBanner === 'full-success'
                    ? t('assessment.breakthrough.dashboardAndArenaSuccess')
                    : t('assessment.breakthrough.dashboardPersistedOnly')}
                </p>
              ) : null}

              {showArenaFeedback && arenaSync?.summary ? (
                <LadderSyncSummaryStatus
                  className="mt-3"
                  summary={arenaSync.summary}
                  failures={arenaSync.failures}
                  variant="assessment"
                />
              ) : null}

              <button
                type="button"
                className="mt-3 block w-full py-1 text-center text-xs font-normal tracking-wide text-zinc-500 transition hover:text-zinc-300"
                disabled={actionsBusy}
                onClick={onClose}
              >
                {t('assessment.breakthrough.confirmDismiss')}
              </button>
            </div>
          ) : (
            <div className="mt-6 w-full">
              <button
                type="button"
                className="block w-full py-1 text-center text-xs font-normal tracking-wide text-zinc-500 transition hover:text-zinc-300"
                onClick={onClose}
              >
                {t('assessment.breakthrough.confirmDismiss')}
              </button>
            </div>
          )}
        </AuraReactiveFrame>
      </div>

      <LadderUploadGateSheetPortal
        gateSheetKind={gateSheetKind}
        open={gateSheetOpen}
        onClose={closeGateSheet}
        onConfirm={confirmGateSheet}
      />
    </div>,
    document.body
  );
};

export default PerformanceBreakthroughModal;
