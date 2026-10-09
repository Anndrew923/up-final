import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { isLadderRoutePath, isHomeRoutePath, ROUTES } from '../../config/routes';
import { buildDynoIntelContext } from '../../logic/core/buildDynoIntelContext';
import { enrichDynoIntelContextCardCopy } from '../../logic/core/enrichDynoIntelContextCardCopy';
import { resolveDynoPaywallWeakestBrief } from '../../logic/core/dynoIntelPaywallBrief';
import { useDynoIntelChat } from '../../hooks/useDynoIntelChat';
import { useDynoIntelQuota } from '../../hooks/useDynoIntelQuota';
import { useDynoIntelSheet } from '../../hooks/useDynoIntelSheet';
import { useDynoIntelSuggestions } from '../../hooks/useDynoIntelSuggestions';
import { useDynoRouteContext } from '../../hooks/useDynoRouteContext';
import {
  canUseDynoIntelFull,
  isEntitlementCheckSettled,
  resolveDynoIntelSheetEntry,
  shouldOpenDynoIntelQuotaExhaustedPaywall,
} from '../../logic/core/dynoIntelGates';
import {
  buildDynoIntelLaunchRequestId,
  claimDynoIntelLaunchFlush,
  markDynoIntelLaunchFlushAccepted,
  releaseDynoIntelLaunchFlushInFlight,
  resetDynoIntelLaunchFlushInFlight,
  shouldClearChatForSpectrumOpen,
  shouldRetryLaunchFlushAfterRelease,
  type DynoIntelLaunchFlushLock,
} from '../../logic/core/dynoIntelLaunchFlush';
import { DYNO_INTEL_LOCAL_LOG_CAP } from '../../logic/core/dynoIntelLogLimits';
import type { DynoIntelMode } from '../../logic/core/dynoIntelTypes';
import { pushAndroidBackDismiss } from '../../lib/androidBackDismissStack';
import { navigateFromUiGate } from '../../lib/uiGateNavigation';
import { joinArenaPath } from '../../lib/joinArenaNavigation';
import { purchaseProSubscription } from '../../services/subscriptionService';
import { useAuthStore } from '../../stores/authStore';
import { useDynoIntelLogStore } from '../../stores/dynoIntelLogStore';
import { useDynoIntelLaunchStore } from '../../stores/dynoIntelLaunchStore';
import { useEntitlementStore } from '../../stores/entitlementStore';
import { selectEntitlementState } from '../../stores/entitlementSelectors';
import { useShellInteractionBlocked } from '../../stores/uiInteractionStore';
import LeaderboardGateSheet from '../ladder/LeaderboardGateSheet';
import DynoActiveTrigger from './DynoActiveTrigger';
import DynoIntelBottomSheet, { type DynoIntelSheetView } from './DynoIntelBottomSheet';
import type { DynoIntelPaywallReason } from '../../types/dynoIntelPaywall';
import { useDynoIntelContextBuilder } from '../../hooks/useDynoIntelContextBuilder';
import { useDynoIntelTriggerDiscovery } from '../../hooks/useDynoIntelTriggerDiscovery';

const HIDDEN_TRIGGER_ROUTES = new Set<string>([ROUTES.authChoice, ROUTES.joinArena]);
/** v2.4.2 — inference always cross-axis; route label is UI-only. */
const DYNO_INFERENCE_MODE: DynoIntelMode = 'cross-axis';

const DynoIntelConsole = () => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isShellBlocked = useShellInteractionBlocked();
  const route = useDynoRouteContext();
  const { open: sheetOpen, openSheet, closeSheet } = useDynoIntelSheet();
  const quota = useDynoIntelQuota();
  const buildRadarInput = useDynoIntelContextBuilder();
  const { discovered, markDiscovered } = useDynoIntelTriggerDiscovery();

  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const entitlementRefreshing = useEntitlementStore((s) => s.isRefreshing);
  const logEntries = useDynoIntelLogStore((s) => s.entries);
  const loadLocalLogs = useDynoIntelLogStore((s) => s.loadLocalLogs);
  const getMostRecentLog = useDynoIntelLogStore((s) => s.getMostRecent);
  const clearLocalLogs = useDynoIntelLogStore((s) => s.clearLocalLogs);
  const logStorageError = useDynoIntelLogStore((s) => s.storageError);
  const launchRequestId = useDynoIntelLaunchStore((s) => s.requestId);
  const pendingPrompt = useDynoIntelLaunchStore((s) => s.pendingPrompt);
  const clearPendingLaunch = useDynoIntelLaunchStore((s) => s.clearPending);

  const [sheetView, setSheetView] = useState<DynoIntelSheetView>('chat');
  const [paywallReason, setPaywallReason] = useState<DynoIntelPaywallReason>('pro-required');
  const [paywallBusy, setPaywallBusy] = useState(false);
  const [paywallBillingError, setPaywallBillingError] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);

  const resolveBaseContext = useCallback(() => {
    const locale = i18n.language === 'zh-Hant' ? 'zh-Hant' : 'en';
    const snapshot = buildRadarInput();
    return buildDynoIntelContext({
      radarInput: snapshot,
      historyRecords: snapshot.historyRecords,
      liveScoreOverrides: snapshot.liveScoreOverrides,
      locale,
      mode: DYNO_INFERENCE_MODE,
      focusAxis: null,
      focusSupplemental: null,
    });
  }, [buildRadarInput, i18n.language]);

  const enrichContext = useCallback(
    (base: ReturnType<typeof buildDynoIntelContext>, userQuestion: string) =>
      enrichDynoIntelContextCardCopy(base, t, userQuestion),
    [t]
  );

  const paywallContext = useMemo(
    () => enrichContext(resolveBaseContext(), ''),
    [enrichContext, resolveBaseContext]
  );

  const paywallBrief = useMemo(
    () => resolveDynoPaywallWeakestBrief(paywallContext),
    [paywallContext]
  );

  const suggestionItems = useDynoIntelSuggestions(paywallBrief.axis);

  const openPaywall = useCallback(
    (reason: DynoIntelPaywallReason) => {
      setPaywallReason(reason);
      setPaywallBillingError(false);
      setSheetView('paywall');
      openSheet();
    },
    [openSheet]
  );

  const handleAuthBlocked = useCallback(() => {
    // WHY: Spectrum handoff cannot complete without auth — drop pending so it does not surprise later.
    clearPendingLaunch();
    setAuthGateOpen(true);
  }, [clearPendingLaunch]);

  /**
   * Full-page Pro funnel only when native billing cannot complete in-sheet
   * (e.g. RevenueCat offerings missing). WHY: Preserve surface via allowlisted `returnTo`.
   */
  const openJoinArenaProFunnel = useCallback(() => {
    clearPendingLaunch();
    closeSheet();
    navigate(joinArenaPath('dyno-intel', pathname));
  }, [clearPendingLaunch, closeSheet, navigate, pathname]);

  const chat = useDynoIntelChat({
    mode: DYNO_INFERENCE_MODE,
    resolveContext: () => resolveBaseContext(),
    enrichContext,
    quota,
    onPaywallRequest: openPaywall,
    onAuthBlocked: handleAuthBlocked,
  });
  const sendQuestion = chat.sendQuestion;

  const { restoreFromLog, clearChat } = chat;

  const consoleLabel = t(`dynoIntel.console.${route.consoleLabelKey}`);

  const restoreLatestLog = useCallback(() => {
    loadLocalLogs();
    const latest = getMostRecentLog();
    if (latest) {
      restoreFromLog(latest);
      return;
    }
    clearChat();
  }, [clearChat, getMostRecentLog, loadLocalLogs, restoreFromLog]);

  const launchFlushLockRef = useRef<DynoIntelLaunchFlushLock>({
    flushedLaunchRequestId: 0,
    inFlightLaunchRequestId: 0,
  });

  const openSheetWithGate = useCallback(() => {
    const entry = resolveDynoIntelSheetEntry(
      DYNO_INFERENCE_MODE,
      entitlement,
      authStatus,
      isAnonymous
    );
    if (!entry.access.allowed) {
      // WHY: Auth bootstrap `pending` — keep Spectrum prompt and retry when authStatus settles.
      if (entry.access.blockReason === 'pending') {
        return;
      }
      if (entry.access.blockReason === 'auth') {
        handleAuthBlocked();
        return;
      }
      // WHY: Unauthenticated is auth sheet; missing Pro stays in Bottom Sheet paywall (Spotify-style).
      // Keep pendingPrompt through Pro paywall so subscribe → chat can still auto-send decode.
      openPaywall('pro-required');
      return;
    }
    // WHY: Only after RC refresh settles may we treat "free + remaining 0" as a real upgrade cue.
    if (
      shouldOpenDynoIntelQuotaExhaustedPaywall({
        entitlementSettled: isEntitlementCheckSettled(entitlement, entitlementRefreshing),
        hasProFullAccess: canUseDynoIntelFull(entitlement, authStatus, isAnonymous),
        quotaSynced: quota.isSynced,
        remaining: quota.remaining,
      })
    ) {
      // Keep pendingPrompt — after Pro subscribe / reset, chat open can flush the decode.
      openPaywall('quota-exhausted');
      return;
    }
    setSheetView('chat');
    // WHY: Spectrum decode must not ride under a restored prior log; normal trigger still restores.
    // Skip clearChat while auto-flush is in flight — resetting status to idle re-opens a double-send window.
    const launchState = useDynoIntelLaunchStore.getState();
    if (launchState.pendingPrompt) {
      if (
        shouldClearChatForSpectrumOpen(
          launchFlushLockRef.current.inFlightLaunchRequestId,
          launchState.requestId,
          true
        )
      ) {
        clearChat();
      }
    } else {
      restoreLatestLog();
    }
    openSheet();
  }, [
    authStatus,
    clearChat,
    entitlement,
    entitlementRefreshing,
    handleAuthBlocked,
    isAnonymous,
    openPaywall,
    openSheet,
    quota.remaining,
    quota.isSynced,
    restoreLatestLog,
  ]);

  const handleSheetClose = useCallback(() => {
    clearPendingLaunch();
    // WHY: Abandoning the sheet must drop zombie in-flight claims so the next launch can claim.
    resetDynoIntelLaunchFlushInFlight(launchFlushLockRef.current);
    closeSheet();
    setSheetView('chat');
    setPaywallBillingError(false);
    setSuggestionsDismissed(false);
  }, [clearPendingLaunch, closeSheet]);

  const openSheetWithGateRef = useRef(openSheetWithGate);
  openSheetWithGateRef.current = openSheetWithGate;
  const sendQuestionRef = useRef(sendQuestion);
  sendQuestionRef.current = sendQuestion;
  const clearPendingLaunchRef = useRef(clearPendingLaunch);
  clearPendingLaunchRef.current = clearPendingLaunch;
  /** Bumped when a superseded launch must retry after an older in-flight flush settles. */
  const [flushRetryToken, setFlushRetryToken] = useState(0);

  // WHY: Assessment Hall Spectrum CTA queues a prompt; Console owns gated open + auto-send.
  // Also re-runs when auth leaves `loading` so bootstrap-pending launches are not dropped.
  useEffect(() => {
    if (launchRequestId <= 0) return;
    if (!useDynoIntelLaunchStore.getState().pendingPrompt) return;
    if (authStatus === 'loading') return;
    openSheetWithGateRef.current();
  }, [launchRequestId, authStatus]);

  // WHY: Sync in-flight claim before await — sendQuestion identity churn must not double-bill.
  // Paywall/auth rejection releases in-flight so subscribe → chat can re-flush the same launch.
  useEffect(() => {
    if (!sheetOpen || sheetView !== 'chat' || !pendingPrompt) return;
    const lock = launchFlushLockRef.current;
    if (!claimDynoIntelLaunchFlush(lock, launchRequestId)) return;
    const prompt = pendingPrompt;
    const requestId = launchRequestId;
    const idempotencyKey = buildDynoIntelLaunchRequestId(requestId);
    setSuggestionsDismissed(true);
    void (async () => {
      try {
        const accepted = await sendQuestionRef.current(prompt, { requestId: idempotencyKey });
        if (!accepted) {
          releaseDynoIntelLaunchFlushInFlight(lock, requestId);
          return;
        }
        const launchState = useDynoIntelLaunchStore.getState();
        if (launchState.requestId !== requestId) {
          releaseDynoIntelLaunchFlushInFlight(lock, requestId);
          if (
            shouldRetryLaunchFlushAfterRelease({
              completedLaunchRequestId: requestId,
              currentLaunchRequestId: launchState.requestId,
              hasPendingPrompt: Boolean(launchState.pendingPrompt),
            })
          ) {
            setFlushRetryToken((token) => token + 1);
          }
          return;
        }
        markDynoIntelLaunchFlushAccepted(lock, requestId);
        clearPendingLaunchRef.current();
      } catch {
        releaseDynoIntelLaunchFlushInFlight(lock, requestId);
      }
    })();
  }, [flushRetryToken, launchRequestId, pendingPrompt, sheetOpen, sheetView]);

  // WHY: Android back must close Dyno before tab-root ExitConfirm — register only while open.
  useEffect(() => {
    if (!sheetOpen) return;
    return pushAndroidBackDismiss(() => {
      handleSheetClose();
      return true;
    });
  }, [handleSheetClose, sheetOpen]);

  const handlePaywallDismiss = useCallback(() => {
    // WHY: Soft-dismiss abandons Spectrum decode — clearing prevents a chat-view flush that then
    // re-opens paywall and permanently loses the prompt.
    clearPendingLaunch();
    resetDynoIntelLaunchFlushInFlight(launchFlushLockRef.current);
    setSheetView('chat');
    setPaywallBillingError(false);
  }, [clearPendingLaunch]);

  const handlePaywallSubscribe = useCallback(async () => {
    setPaywallBillingError(false);
    setPaywallBusy(true);
    try {
      const result = await purchaseProSubscription();
      if (!result.ok) {
        // WHY: Native RC configured but offerings/purchase unavailable — escalate with returnTo.
        if (result.reason === 'billing-unavailable' || result.reason === 'no-offerings') {
          openJoinArenaProFunnel();
          return;
        }
        setPaywallBillingError(true);
        return;
      }
      // WHY: Hard-sync purchase already committed Firestore SSOT into the store — do not
      // refreshEntitlement() here or a lagging RC snapshot can race-overwrite the new Pro grant.
      setSheetView('chat');
      // WHY: Spectrum decode must not flash under a restored prior log after subscribe.
      if (useDynoIntelLaunchStore.getState().pendingPrompt) {
        clearChat();
      } else {
        restoreLatestLog();
      }
    } finally {
      setPaywallBusy(false);
    }
  }, [clearChat, openJoinArenaProFunnel, restoreLatestLog]);

  const handleSubmitQuestion = useCallback(
    (question: string) => {
      void sendQuestion(question);
    },
    [sendQuestion]
  );

  useEffect(() => {
    if (chat.status === 'loading' || chat.status === 'typing') {
      setSuggestionsDismissed(true);
    }
  }, [chat.status]);

  const showSuggestionChips =
    sheetView === 'chat' &&
    !suggestionsDismissed &&
    !chat.visibleText &&
    !chat.lastReply &&
    chat.status !== 'loading' &&
    chat.status !== 'typing';

  // WHY: Ladder floating rank / Join Arena own the bottom band —
  // hide Dyno Intel chip only (BottomNav + center hex stay). Calculators use in-flow CTAs.
  const hideTrigger =
    isShellBlocked || HIDDEN_TRIGGER_ROUTES.has(pathname) || isLadderRoutePath(pathname);

  const showCallout = !discovered && isHomeRoutePath(pathname) && !hideTrigger && !sheetOpen;

  const handleTriggerPress = useCallback(() => {
    if (!discovered) markDiscovered();
    openSheetWithGate();
  }, [discovered, markDiscovered, openSheetWithGate]);

  return (
    <>
      <DynoActiveTrigger
        consoleLabel={consoleLabel}
        onPress={handleTriggerPress}
        hidden={hideTrigger}
        sheetOpen={sheetOpen}
        discovered={discovered}
        showCallout={showCallout}
        onCalloutDismiss={markDiscovered}
      />
      <DynoIntelBottomSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        view={sheetView}
        paywallReason={paywallReason}
        paywallBusy={paywallBusy}
        paywallBillingError={paywallBillingError}
        onPaywallSubscribe={() => void handlePaywallSubscribe()}
        onPaywallDismiss={handlePaywallDismiss}
        consoleLabel={consoleLabel}
        remaining={quota.remaining}
        limit={quota.limit}
        quotaKnown={quota.isSynced}
        commentary={chat.visibleText}
        displayMeta={chat.lastDisplayMeta}
        status={chat.status}
        errorMessage={chat.errorMessageKey ? t(chat.errorMessageKey) : null}
        onSubmitQuestion={handleSubmitQuestion}
        suggestionItems={suggestionItems}
        showSuggestionChips={showSuggestionChips}
        suggestionGroupAriaLabel={t('dynoIntel.suggestions.ariaLabel')}
        onSuggestionSelect={handleSubmitQuestion}
        telemetryLogs={logEntries}
        telemetryLogCap={DYNO_INTEL_LOCAL_LOG_CAP}
        telemetryStorageError={logStorageError}
        onClearTelemetryLogs={clearLocalLogs}
      />
      <LeaderboardGateSheet
        open={authGateOpen}
        kind="auth"
        description={t('dynoIntel.gate.authDescription')}
        secondaryLabel={t('gateSheet.secondary')}
        onPrimary={() => {
          setAuthGateOpen(false);
          // WHY: After Google link, return to the surface that opened Dyno — not a blind home dump.
          navigateFromUiGate(navigate, { kind: 'auth' }, pathname);
        }}
        onSecondary={() => setAuthGateOpen(false)}
      />
    </>
  );
};

export default DynoIntelConsole;
