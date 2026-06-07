import { useCallback, useEffect, useId, useRef, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { ROUTES } from '../../config/routes';
import type { PerformanceBreakthroughPayload } from '../../logic/core/performanceBreakthrough';
import { shouldShowLadderSyncFeedback } from '../../logic/core/ladderSyncFeedback';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { AssessmentLadderSyncController } from '../../hooks/useLeaderboardSyncAssessmentPage';
import { useLadderUploadGateSheet } from '../../hooks/useLadderUploadGateSheet';
import LadderUploadGateSheetPortal from '../ladder/LadderUploadGateSheetPortal';
import LadderSyncSummaryStatus from '../ladder/LadderSyncSummaryStatus';
import { AURA_THEME } from './auraThemeTokens';
import AuraReactiveFrame from './AuraReactiveFrame';
import TachometerMilestoneBar from './TachometerMilestoneBar';

export interface PerformanceBreakthroughModalProps {
  open: boolean;
  payload: PerformanceBreakthroughPayload | null;
  onClose: () => void;
  onSyncToDashboard?: () => void | Promise<void>;
  syncDisabled?: boolean;
  syncing?: boolean;
  /** Route A coupled assessment ladder sync — shares one controller with page sync bar. */
  arenaSync?: AssessmentLadderSyncController;
}

const PerformanceBreakthroughModal: FC<PerformanceBreakthroughModalProps> = ({
  open,
  payload,
  onClose,
  onSyncToDashboard,
  syncDisabled = false,
  syncing = false,
  arenaSync,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [syncPending, setSyncPending] = useState(false);
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
  const showArenaSync = arenaSync != null;
  const showDashboardSync = onSyncToDashboard != null;
  const showArenaFeedback = shouldShowLadderSyncFeedback(
    arenaSync?.summary ?? null,
    arenaSync?.failures ?? []
  );

  const handleDashboardSync = useCallback(async () => {
    if (!onSyncToDashboard || isDashboardSyncing || syncDisabled) return;
    setSyncPending(true);
    try {
      await onSyncToDashboard();
    } finally {
      setSyncPending(false);
    }
  }, [isDashboardSyncing, onSyncToDashboard, syncDisabled]);

  const handleArenaSync = useCallback(() => {
    if (!arenaSync || isArenaSyncing || isDashboardSyncing) return;
    if (arenaSync.targetCount === 0) return;
    if (tryOpenGateSheet(arenaSync.gate)) return;
    arenaSync.clearFeedback();
    void arenaSync.syncPage();
  }, [arenaSync, tryOpenGateSheet, isArenaSyncing, isDashboardSyncing]);

  useEffect(() => {
    if (!open) {
      const id = window.setTimeout(() => {
        setSyncPending(false);
        resetGateSheet();
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [open, resetGateSheet]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !payload || typeof document === 'undefined') return null;

  const theme = AURA_THEME[payload.auraKey];
  const hasActions = showDashboardSync || showArenaSync;

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
            {payload.rankLabel !== payload.title ? (
              <p className={`text-xs font-semibold tracking-wide text-aura-neon ${theme.text}`}>
                {payload.rankLabel}
              </p>
            ) : null}
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
                  disabled={syncDisabled || isDashboardSyncing || isArenaSyncing}
                  onClick={() => void handleDashboardSync()}
                >
                  {isDashboardSyncing
                    ? t('assessment.breakthrough.syncing')
                    : t('assessment.breakthrough.syncBtn')}
                </button>
              ) : null}

              {showArenaSync ? (
                <button
                  type="button"
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium text-zinc-200 transition-all duration-200 hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40"
                  disabled={
                    isArenaSyncing ||
                    isDashboardSyncing ||
                    arenaSync.targetCount === 0 ||
                    arenaSync.gate === 'no-score' ||
                    arenaSync.gate === 'invalid-score'
                  }
                  onClick={handleArenaSync}
                >
                  {isArenaSyncing
                    ? t('assessment.breakthrough.syncToArenaBusy')
                    : t('assessment.breakthrough.syncToArena')}
                </button>
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
                disabled={isDashboardSyncing || isArenaSyncing}
                onClick={onClose}
              >
                {t('assessment.breakthrough.dismiss')}
              </button>
            </div>
          ) : (
            <div className="mt-6 w-full">
              <button
                type="button"
                className="block w-full py-1 text-center text-xs font-normal tracking-wide text-zinc-500 transition hover:text-zinc-300"
                onClick={onClose}
              >
                {t('assessment.breakthrough.dismiss')}
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
