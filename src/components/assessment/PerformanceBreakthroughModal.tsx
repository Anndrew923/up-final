import { useCallback, useEffect, useId, useRef, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { ROUTES } from '../../config/routes';
import type { PerformanceBreakthroughPayload } from '../../logic/core/performanceBreakthrough';
import { resolveBreakthroughArenaPipelineBanner } from '../../logic/core/breakthroughArenaPipeline';
import {
  hasBreakthroughDualSyncFloor,
  resolveBroadcastMetricFromBreakthrough,
  shouldOfferClubDispatchFlow,
} from '../../logic/core/clubProgressDispatchUi';
import { resolveBreakthroughPipelineCopyKey } from '../../logic/core/membershipSyncSurface';
import { shouldShowLadderSyncFeedback } from '../../logic/core/ladderSyncFeedback';
import { waitForReactSettlement } from '../../lib/reactSettlement';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import type { AssessmentLadderSyncController } from '../../hooks/useLeaderboardSyncAssessmentPage';
import { useLadderIdentityUploadGate } from '../../hooks/useLadderIdentityUploadGate';
import { useLadderUploadGateSheet } from '../../hooks/useLadderUploadGateSheet';
import LadderIdentitySheet from '../ladder/LadderIdentitySheet';
import LadderUploadGateSheetPortal from '../ladder/LadderUploadGateSheetPortal';
import LadderSyncSummaryStatus from '../ladder/LadderSyncSummaryStatus';
import AuraReactiveFrame from './AuraReactiveFrame';
import ClubDispatchModal from './ClubDispatchModal';
import TachometerMilestoneBar from './TachometerMilestoneBar';
import AssessmentHeroScoreWithNormBadge from './AssessmentHeroScoreWithNormBadge';
import { HallSpectrumEntryButton } from './AssessmentScoreMeaningPanel';

type ClubSyncIntent = 'global' | 'guild';

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
  /**
   * Same upgrade-guide string as the page score-meaning panel (raw gap when available).
   * Omitted → TachometerMilestoneBar keeps points-only breakthrough copy.
   */
  milestoneHintLabel?: string | null;
  /**
   * Scheme B inside breakthrough — opens Hall spectrum after immersive summary expand.
   * WHY: Norm badge stays expand-only; Hall gets a dedicated CTA (null/undefined hides it).
   */
  onOpenHallSpectrum?: () => void;
  /**
   * True while HallOfFameSpectrumDrawer covers this modal (z-245 over z-240).
   * WHY: Disable focus trap + Escape so nested Hall owns dismiss; avoids closing both layers.
   */
  spectrumOverlayOpen?: boolean;
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
  milestoneHintLabel = null,
  onOpenHallSpectrum,
  spectrumOverlayOpen = false,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const summaryId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const arenaSyncRef = useRef(arenaSync);
  arenaSyncRef.current = arenaSync;
  const [syncPending, setSyncPending] = useState(false);
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [dashboardPersistedInSession, setDashboardPersistedInSession] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [clubDispatchOpen, setClubDispatchOpen] = useState(false);
  const [pendingClubIntent, setPendingClubIntent] = useState<ClubSyncIntent | null>(null);
  const {
    identitySheetOpen,
    closeIdentitySheet,
    ensureIdentityReady,
  } = useLadderIdentityUploadGate();
  const {
    gateSheetOpen,
    gateSheetKind,
    tryOpenGateSheet,
    closeGateSheet,
    confirmGateSheet,
    resetGateSheet,
  } = useLadderUploadGateSheet(ROUTES.ladder);
  // WHY: Yield trap while Hall / club-dispatch / identity / Pro gate is stacked above celebration.
  const nestedOverlayOpen =
    spectrumOverlayOpen || clubDispatchOpen || identitySheetOpen || gateSheetOpen;
  useFocusTrap(dialogRef, open && !nestedOverlayOpen);

  const isDashboardSyncing = syncing || syncPending;
  const isArenaSyncing = arenaSync?.busy ?? false;
  const isPipelineRunning = pipelineBusy || isArenaSyncing;
  const showDashboardThenArena = onPersistToDashboard != null && arenaSync != null;
  const showDashboardSync = onSyncToDashboard != null;
  const membershipSurface = arenaSync?.membershipSurface ?? 'global-only';
  // WHY: Dual membership owns both the club CTA and the ClubDispatchModal celebration beat.
  const isDualMembership = shouldOfferClubDispatchFlow(membershipSurface);
  const showArenaFeedback = shouldShowLadderSyncFeedback(
    arenaSync?.summary ?? null,
    arenaSync?.failures ?? []
  );
  const pipelineBanner = resolveBreakthroughArenaPipelineBanner(
    dashboardPersistedInSession,
    arenaSync?.summary,
    arenaSync?.lastCloudOutcome ?? null
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

  const runPersistThenCloud = useCallback(
    async (
      intent: ClubSyncIntent,
      dispatch?: { broadcast: boolean; comment?: string }
    ) => {
      if (!onPersistToDashboard || !arenaSync || isDashboardSyncing || isPipelineRunning) return;
      // pending ≈ global-only: allow global; club CTA is hidden until dual.
      if (intent === 'guild' && membershipSurface !== 'dual') return;

      if (intent === 'guild') {
        if (!(arenaSync.overallScore > 0)) return;
      } else if (membershipSurface === 'dual') {
        if (
          !hasBreakthroughDualSyncFloor(arenaSync.overallScore, arenaSync.targetCount)
        ) {
          return;
        }
      } else {
        if (arenaSync.targetCount === 0) return;
        if (tryOpenGateSheet(arenaSync.gate)) return;
        // WHY: Shared gate with sync bars — never silent-fail global-only without identity UX.
        if (!ensureIdentityReady()) return;
      }

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

        const guildBroadcastOptions =
          dispatch?.broadcast === true
            ? {
                broadcast: true as const,
                comment: dispatch.comment ?? '',
                broadcastMetricType: payload
                  ? resolveBroadcastMetricFromBreakthrough(payload.metric)
                  : ('overall' as const),
              }
            : dispatch
              ? { broadcast: false as const }
              : undefined;

        if (intent === 'guild') {
          await sync.syncPageGuild(guildBroadcastOptions);
        } else if (membershipSurface === 'dual' && guildBroadcastOptions) {
          // WHY: Club-first captures true previousScore for D2 broadcast before global
          // ladderScore fan-out overwrites guilds.members[] (otherwise δ≈0 skips FCM).
          const guildResult = await sync.syncPageGuild({
            ...guildBroadcastOptions,
            skipFinished: true,
          });
          // Soft arena UX: open Pro/identity sheets when needed. Always continue into
          // syncPageGlobal so afterGuild can preserve club HUD + fire deferred onFinished.
          const gateBlocked = tryOpenGateSheet(sync.gate);
          if (!gateBlocked) {
            ensureIdentityReady();
          }
          await sync.syncPageGlobal(
            guildResult?.ok === true ? { afterGuild: true } : undefined
          );
        } else {
          await sync.syncPageGlobal();
        }
      } catch (err) {
        console.error('[Breakthrough Pipeline Fatal]', err);
      } finally {
        setPipelineBusy(false);
      }
    },
    [
      arenaSync,
      ensureIdentityReady,
      isDashboardSyncing,
      isPipelineRunning,
      membershipSurface,
      onPersistToDashboard,
      payload,
      tryOpenGateSheet,
    ]
  );

  const openClubDispatch = useCallback(
    (intent: ClubSyncIntent) => {
      if (!arenaSync || isDashboardSyncing || isPipelineRunning) return;
      if (intent === 'guild') {
        if (!(arenaSync.overallScore > 0)) return;
      } else if (membershipSurface === 'dual') {
        if (
          !hasBreakthroughDualSyncFloor(arenaSync.overallScore, arenaSync.targetCount)
        ) {
          return;
        }
      } else {
        if (arenaSync.targetCount === 0) return;
        if (tryOpenGateSheet(arenaSync.gate)) return;
        if (!ensureIdentityReady()) return;
      }
      setPendingClubIntent(intent);
      setClubDispatchOpen(true);
    },
    [
      arenaSync,
      ensureIdentityReady,
      isDashboardSyncing,
      isPipelineRunning,
      membershipSurface,
      tryOpenGateSheet,
    ]
  );

  const closeClubDispatch = useCallback(() => {
    if (isPipelineRunning) return;
    setClubDispatchOpen(false);
    setPendingClubIntent(null);
  }, [isPipelineRunning]);

  const confirmClubDispatch = useCallback(
    async (broadcast: boolean, comment = '') => {
      const intent = pendingClubIntent;
      if (!intent || isPipelineRunning) return;
      // WHY: Close celebration first so nested Escape/focus returns to breakthrough during sync.
      setClubDispatchOpen(false);
      setPendingClubIntent(null);
      await runPersistThenCloud(intent, { broadcast, comment });
    },
    [isPipelineRunning, pendingClubIntent, runPersistThenCloud]
  );

  const toggleSummaryExpanded = useCallback(() => {
    setSummaryExpanded((prev) => !prev);
  }, []);

  // WHY: Each breakthrough reveal starts collapsed — prior expand state would steal dopamine focus.
  useEffect(() => {
    if (!open) return;
    setSummaryExpanded(false);
    setClubDispatchOpen(false);
    setPendingClubIntent(null);
    closeIdentitySheet();
  }, [closeIdentitySheet, open, payload?.metric, payload?.scoreDisplay, payload?.populationClass]);

  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => {
      setSyncPending(false);
      setPipelineBusy(false);
      setDashboardPersistedInSession(false);
      setSummaryExpanded(false);
      setClubDispatchOpen(false);
      setPendingClubIntent(null);
      closeIdentitySheet();
      resetGateSheet();
    }, 0);
    return () => window.clearTimeout(id);
  }, [closeIdentitySheet, open, resetGateSheet]);

  useShellScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // WHY: Nested Hall / dispatch / identity sheets own Escape while stacked above.
      if (event.key === 'Escape' && !nestedOverlayOpen) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, nestedOverlayOpen]);

  if (!open || !payload || typeof document === 'undefined') return null;

  const hasActions = showDashboardSync || showDashboardThenArena;
  const actionsBusy = isDashboardSyncing || isPipelineRunning;
  const hasSummary = Boolean(String(payload.summary ?? '').trim());
  const badgeAriaLabel = summaryExpanded
    ? t('assessment.breakthrough.normBadgeCollapseAria', {
        populationClass: payload.populationClass,
      })
    : t('assessment.breakthrough.normBadgeExpandAria', {
        populationClass: payload.populationClass,
      });

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.performanceBreakthroughModal} flex items-center justify-center ui-modal-safe-shell`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label={t('assessment.breakthrough.closeAria')}
        // WHY: Nested Hall / ClubDispatch own dismiss; backdrop must not nuke pending sync intent.
        disabled={nestedOverlayOpen}
        onClick={() => {
          if (nestedOverlayOpen) return;
          onClose();
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md motion-reduce:animate-none animate-breakthrough-enter will-change-[transform,opacity]"
        onClick={(event) => event.stopPropagation()}
      >
        <AuraReactiveFrame auraKey={payload.auraKey} className="max-h-[min(88dvh,40rem)]">
          {/*
            WHY: Scroll the score/summary/tachometer column only — keep dual CTAs pinned so
            expand never pushes primary actions below the fold on short mobile viewports.
          */}
          <div className="flex max-h-[min(88dvh,40rem)] flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <header className="space-y-2 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-500">
                  {t('assessment.breakthrough.kicker')}
                </p>
                <h2 id={titleId} className="text-xl font-bold tracking-tight text-zinc-50">
                  {payload.title}
                </h2>
                <AssessmentHeroScoreWithNormBadge
                  variant="breakthrough"
                  scoreText={payload.scoreDisplay}
                  populationClass={payload.populationClass}
                  decadeKey={payload.decadeKey}
                  onBadgeClick={hasSummary ? toggleSummaryExpanded : undefined}
                  badgeExpanded={summaryExpanded}
                  showChevron={hasSummary}
                  badgeAriaControls={hasSummary ? summaryId : undefined}
                  badgeAriaLabel={hasSummary ? badgeAriaLabel : undefined}
                />
              </header>

              {hasSummary ? (
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
                    summaryExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div
                    className={`min-h-0 overflow-hidden ${summaryExpanded ? '' : 'pointer-events-none'}`}
                    inert={summaryExpanded ? undefined : true}
                  >
                    <p
                      id={summaryId}
                      role="region"
                      aria-label={t('assessment.breakthrough.summaryRegionAria', {
                        populationClass: payload.populationClass,
                      })}
                      aria-hidden={!summaryExpanded}
                      className="mt-4 text-center text-sm leading-relaxed text-zinc-300"
                    >
                      {payload.summary}
                    </p>
                    {/* WHY: Hall entry only after dopamine summary read — badge stays expand-only. */}
                    {summaryExpanded && onOpenHallSpectrum ? (
                      <div className="mt-4 px-1">
                        <HallSpectrumEntryButton
                          className="w-full justify-center rounded-lg"
                          onClick={onOpenHallSpectrum}
                          label={t('assessment.hallSpectrum.viewEntry')}
                          ariaLabel={t('assessment.hallSpectrum.viewEntryAria')}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 border-t border-zinc-800/90 pt-5">
                <TachometerMilestoneBar
                  progress01={payload.milestone.progress01}
                  remainingPoints={payload.milestone.remainingPoints}
                  auraKey={payload.auraKey}
                  milestoneHintLabel={milestoneHintLabel}
                />
              </div>
            </div>

            {hasActions ? (
              <div className="mt-2 w-full shrink-0">
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

                {showDashboardThenArena && arenaSync ? (
                  <div className="mt-2 space-y-2">
                    <button
                      type="button"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium tracking-tight text-zinc-200 transition-all duration-200 hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40"
                      disabled={
                        syncDisabled ||
                        actionsBusy ||
                        arenaSync.targetCount === 0 ||
                        arenaSync.gate === 'no-score' ||
                        arenaSync.gate === 'invalid-score'
                      }
                      onClick={() => {
                        if (isDualMembership) {
                          openClubDispatch('global');
                          return;
                        }
                        void runPersistThenCloud('global');
                      }}
                    >
                      {isPipelineRunning
                        ? t('assessment.breakthrough.syncDashboardThenArenaBusy')
                        : isDualMembership
                          ? t('assessment.breakthrough.syncDashboardThenArenaWithClub')
                          : t('assessment.breakthrough.syncDashboardThenArena')}
                    </button>
                    {isDualMembership ? (
                      <button
                        type="button"
                        className="w-full rounded-xl border border-cyan-500/30 bg-transparent py-2.5 text-xs font-medium tracking-tight text-cyan-200/90 transition-all duration-200 hover:bg-cyan-500/10 disabled:pointer-events-none disabled:opacity-40"
                        disabled={
                          syncDisabled ||
                          actionsBusy ||
                          !(arenaSync.overallScore > 0)
                        }
                        onClick={() => {
                          openClubDispatch('guild');
                        }}
                      >
                        {isPipelineRunning
                          ? t('assessment.breakthrough.syncDashboardThenArenaGuildOnlyBusy')
                          : t('assessment.breakthrough.syncDashboardThenArenaGuildOnly')}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {pipelineBanner !== 'none' ? (
                  <p
                    className={`mt-3 text-sm ${
                      pipelineBanner === 'full-success' ||
                      pipelineBanner === 'guild-success' ||
                      pipelineBanner === 'arena-guild-success'
                        ? 'text-emerald-400/90'
                        : 'text-amber-300/90'
                    }`}
                    role="status"
                  >
                    {t(
                      resolveBreakthroughPipelineCopyKey(pipelineBanner) ??
                        'assessment.breakthrough.dashboardPersistedOnly'
                    )}
                  </p>
                ) : null}

                {showArenaFeedback && arenaSync?.summary ? (
                  <LadderSyncSummaryStatus
                    className="mt-3"
                    summary={arenaSync.summary}
                    failures={arenaSync.failures}
                    variant="assessment"
                    currentLadderScore={
                      arenaSync.overallScore > 0 ? arenaSync.overallScore : null
                    }
                    onAutoDismiss={arenaSync.clearFeedback}
                  />
                ) : null}

                <button
                  type="button"
                  className="mt-3 block w-full py-1 text-center text-xs font-normal tracking-wide text-zinc-500 transition hover:text-zinc-300"
                  disabled={actionsBusy || nestedOverlayOpen}
                  onClick={onClose}
                >
                  {t('assessment.breakthrough.confirmDismiss')}
                </button>
              </div>
            ) : (
              <div className="mt-6 w-full shrink-0">
                <button
                  type="button"
                  className="block w-full py-1 text-center text-xs font-normal tracking-wide text-zinc-500 transition hover:text-zinc-300"
                  disabled={nestedOverlayOpen}
                  onClick={onClose}
                >
                  {t('assessment.breakthrough.confirmDismiss')}
                </button>
              </div>
            )}
          </div>
        </AuraReactiveFrame>
      </div>

      <ClubDispatchModal
        open={clubDispatchOpen}
        scoreDisplay={payload.scoreDisplay}
        title={payload.title}
        auraKey={payload.auraKey}
        busy={isPipelineRunning}
        onClose={closeClubDispatch}
        onBroadcast={(comment) => {
          void confirmClubDispatch(true, comment);
        }}
        onSilentSync={() => {
          void confirmClubDispatch(false);
        }}
      />

      <LadderIdentitySheet open={identitySheetOpen} onClose={closeIdentitySheet} />

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
