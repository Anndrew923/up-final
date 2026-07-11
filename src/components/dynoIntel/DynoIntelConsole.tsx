import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { ROUTES } from '../../config/routes';
import { buildDynoIntelContext } from '../../logic/core/buildDynoIntelContext';
import { enrichDynoIntelContextCardCopy } from '../../logic/core/enrichDynoIntelContextCardCopy';
import { resolveDynoPaywallWeakestBrief } from '../../logic/core/dynoIntelPaywallBrief';
import { useDynoIntelChat } from '../../hooks/useDynoIntelChat';
import { useDynoIntelQuota } from '../../hooks/useDynoIntelQuota';
import { useDynoIntelSheet } from '../../hooks/useDynoIntelSheet';
import { useDynoIntelSuggestions } from '../../hooks/useDynoIntelSuggestions';
import { useDynoRouteContext } from '../../hooks/useDynoRouteContext';
import { resolveDynoIntelSheetEntry } from '../../logic/core/dynoIntelGates';
import { DYNO_INTEL_CORE_LOG_CAP } from '../../logic/core/dynoIntelLogLimits';
import { hasProAccess } from '../../logic/core/entitlement';
import type { DynoIntelMode } from '../../logic/core/dynoIntelTypes';
import { navigateFromUiGate } from '../../lib/uiGateNavigation';
import { joinArenaPath } from '../../lib/joinArenaNavigation';
import { hapticService } from '../../services/hapticService';
import { purchaseProSubscription } from '../../services/subscriptionService';
import { useAuthStore } from '../../stores/authStore';
import { useDynoIntelLogStore } from '../../stores/dynoIntelLogStore';
import { useEntitlementStore } from '../../stores/entitlementStore';
import { selectEntitlementState } from '../../stores/entitlementSelectors';
import { useShellInteractionBlocked } from '../../stores/uiInteractionStore';
import LeaderboardGateSheet from '../ladder/LeaderboardGateSheet';
import DynoActiveTrigger from './DynoActiveTrigger';
import DynoIntelBottomSheet, { type DynoIntelSheetView } from './DynoIntelBottomSheet';
import type { DynoIntelPaywallReason } from '../../types/dynoIntelPaywall';
import { useDynoIntelContextBuilder } from '../../hooks/useDynoIntelContextBuilder';

const HIDDEN_TRIGGER_ROUTES = new Set<string>([ROUTES.authChoice, ROUTES.joinArena]);
/** v2.4.2 — inference always cross-axis; route label is UI-only. */
const DYNO_INFERENCE_MODE: DynoIntelMode = 'cross-axis';

const DynoIntelConsole = () => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isShellBlocked = useShellInteractionBlocked();
  const route = useDynoRouteContext();
  const sheet = useDynoIntelSheet();
  const quota = useDynoIntelQuota();
  const buildRadarInput = useDynoIntelContextBuilder();

  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const logEntries = useDynoIntelLogStore((s) => s.entries);
  const loadLocalLogs = useDynoIntelLogStore((s) => s.loadLocalLogs);
  const getMostRecentLog = useDynoIntelLogStore((s) => s.getMostRecent);

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
    },
    [buildRadarInput, i18n.language]
  );

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

  const paywallAxisLabel = useMemo(() => {
    if (!paywallBrief.axis) {
      return t('dynoIntel.paywall.unknownAxis');
    }
    return t(`axisLexicon.output.full.${paywallBrief.axis}`);
  }, [paywallBrief.axis, t]);

  const paywallScoreLabel = useMemo(() => {
    if (paywallBrief.isBlindSpot || paywallBrief.score == null) {
      return t('dynoIntel.paywall.blindSpotScore');
    }
    return String(Math.round(paywallBrief.score * 10) / 10);
  }, [paywallBrief.isBlindSpot, paywallBrief.score, t]);

  const openPaywall = useCallback(
    (reason: DynoIntelPaywallReason) => {
      setPaywallReason(reason);
      setPaywallBillingError(false);
      setSheetView('paywall');
      sheet.openSheet();
    },
    [sheet]
  );

  const handleAuthBlocked = useCallback(() => {
    setAuthGateOpen(true);
  }, []);

  /**
   * Full-page Pro funnel only when native billing cannot complete in-sheet
   * (e.g. RevenueCat offerings missing). WHY: Preserve surface via allowlisted `returnTo`.
   */
  const openJoinArenaProFunnel = useCallback(() => {
    sheet.closeSheet();
    navigate(joinArenaPath('dyno-intel', pathname));
  }, [navigate, pathname, sheet]);

  const chat = useDynoIntelChat({
    mode: DYNO_INFERENCE_MODE,
    resolveContext: () => resolveBaseContext(),
    enrichContext,
    quota,
    onPaywallRequest: openPaywall,
    onAuthBlocked: handleAuthBlocked,
  });

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

  const openSheetWithGate = useCallback(() => {
    const entry = resolveDynoIntelSheetEntry(
      DYNO_INFERENCE_MODE,
      entitlement,
      authStatus,
      isAnonymous
    );
    if (!entry.access.allowed) {
      if (entry.access.blockReason === 'auth') {
        handleAuthBlocked();
        return;
      }
      // WHY: Unauthenticated is auth sheet; missing Pro stays in Bottom Sheet paywall (Spotify-style).
      openPaywall('pro-required');
      return;
    }
    setSheetView('chat');
    restoreLatestLog();
    sheet.openSheet();
  }, [
    authStatus,
    entitlement,
    handleAuthBlocked,
    isAnonymous,
    openPaywall,
    restoreLatestLog,
    sheet,
  ]);

  const handleSheetClose = useCallback(() => {
    sheet.closeSheet();
    setSheetView('chat');
    setPaywallBillingError(false);
    setSuggestionsDismissed(false);
  }, [sheet]);

  const handlePaywallDismiss = useCallback(() => {
    setSheetView('chat');
    setPaywallBillingError(false);
  }, []);

  const handlePaywallSubscribe = useCallback(async () => {
    setPaywallBillingError(false);
    setPaywallBusy(true);
    try {
      void hapticService.triggerProPurchaseIntent();
      const result = await purchaseProSubscription();
      if (!result.ok) {
        // WHY: Native RC configured but offerings/purchase unavailable — escalate with returnTo.
        if (result.reason === 'billing-unavailable') {
          openJoinArenaProFunnel();
          return;
        }
        setPaywallBillingError(true);
        return;
      }
      await useEntitlementStore.getState().refreshEntitlement();
      setSheetView('chat');
      restoreLatestLog();
    } finally {
      setPaywallBusy(false);
    }
  }, [openJoinArenaProFunnel, restoreLatestLog]);

  const handleSubmitQuestion = useCallback(
    (question: string) => {
      void chat.sendQuestion(question);
    },
    [chat.sendQuestion]
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

  const hideTrigger = isShellBlocked || HIDDEN_TRIGGER_ROUTES.has(pathname);
  const isProTelemetry = hasProAccess(entitlement);

  return (
    <>
      <DynoActiveTrigger
        consoleLabel={consoleLabel}
        onPress={openSheetWithGate}
        hidden={hideTrigger}
        sheetOpen={sheet.open}
      />
      <DynoIntelBottomSheet
        open={sheet.open}
        onClose={handleSheetClose}
        view={sheetView}
        paywallReason={paywallReason}
        weakestAxisLabel={paywallAxisLabel}
        paywallScoreLabel={paywallScoreLabel}
        paywallBusy={paywallBusy}
        paywallBillingError={paywallBillingError}
        onPaywallSubscribe={() => void handlePaywallSubscribe()}
        onPaywallDismiss={handlePaywallDismiss}
        consoleLabel={consoleLabel}
        remaining={quota.remaining}
        limit={quota.limit}
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
        telemetryLogCap={isProTelemetry ? null : DYNO_INTEL_CORE_LOG_CAP}
        isProTelemetry={isProTelemetry}
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
