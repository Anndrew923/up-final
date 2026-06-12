import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { ROUTES } from '../../config/routes';
import { buildDynoIntelContext } from '../../logic/core/buildDynoIntelContext';
import { resolveDynoPaywallWeakestBrief } from '../../logic/core/dynoIntelPaywallBrief';
import { useDynoIntelChat } from '../../hooks/useDynoIntelChat';
import { useDynoIntelQuota } from '../../hooks/useDynoIntelQuota';
import { useDynoIntelSheet } from '../../hooks/useDynoIntelSheet';
import { useDynoRouteContext } from '../../hooks/useDynoRouteContext';
import {
  canUseDynoIntelFull,
  resolveDynoIntelSheetEntry,
} from '../../logic/core/dynoIntelGates';
import { resolveWeightSimulationTargetKg } from '../../logic/core/dynoIntelWeightSim';
import type { DynoIntelMode } from '../../logic/core/dynoIntelTypes';
import { navigateFromUiGate } from '../../lib/uiGateNavigation';
import { hapticService } from '../../services/hapticService';
import { purchaseProSubscription } from '../../services/subscriptionService';
import { useAuthStore } from '../../stores/authStore';
import { useEntitlementStore } from '../../stores/entitlementStore';
import { selectEntitlementState } from '../../stores/entitlementSelectors';
import { useShellInteractionBlocked } from '../../stores/uiInteractionStore';
import LeaderboardGateSheet from '../ladder/LeaderboardGateSheet';
import DynoActiveTrigger from './DynoActiveTrigger';
import DynoIntelBottomSheet, {
  type DynoIntelChipView,
  type DynoIntelSheetView,
} from './DynoIntelBottomSheet';
import type { DynoIntelPaywallReason } from '../../types/dynoIntelPaywall';
import { useDynoIntelContextBuilder } from '../../hooks/useDynoIntelContextBuilder';

const HIDDEN_TRIGGER_ROUTES = new Set<string>([ROUTES.authChoice, ROUTES.joinArena]);

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

  const [mode, setMode] = useState<DynoIntelMode>(route.suggestedMode);
  const [sheetView, setSheetView] = useState<DynoIntelSheetView>('chat');
  const [paywallReason, setPaywallReason] = useState<DynoIntelPaywallReason>('pro-required');
  const [paywallBusy, setPaywallBusy] = useState(false);
  const [paywallBillingError, setPaywallBillingError] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);

  useEffect(() => {
    setMode(route.suggestedMode);
  }, [route.suggestedMode, route.consoleLabelKey]);

  const resolveContext = useCallback(
    (effectiveMode: DynoIntelMode) => {
      const locale = i18n.language === 'zh-Hant' ? 'zh-Hant' : 'en';
      const focusAxis = effectiveMode === 'single-axis' ? route.focusAxis : null;
      const snapshot = buildRadarInput();
      const targetWeightKg =
        effectiveMode === 'weight-simulation'
          ? resolveWeightSimulationTargetKg(snapshot.profile)
          : undefined;
      return buildDynoIntelContext({
        radarInput: snapshot,
        historyRecords: snapshot.historyRecords,
        locale,
        mode: effectiveMode,
        focusAxis,
        targetWeightKg,
      });
    },
    [buildRadarInput, i18n.language, route.focusAxis]
  );

  const paywallContext = useMemo(
    () => resolveContext('cross-axis'),
    [resolveContext]
  );

  const paywallBrief = useMemo(
    () => resolveDynoPaywallWeakestBrief(paywallContext),
    [paywallContext]
  );

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

  const handleCoreRequired = useCallback(() => {
    navigate(ROUTES.joinArena);
    sheet.closeSheet();
  }, [navigate, sheet]);

  const chat = useDynoIntelChat({
    mode,
    resolveContext,
    quota,
    onPaywallRequest: openPaywall,
    onAuthBlocked: handleAuthBlocked,
    onCoreRequired: handleCoreRequired,
  });

  const consoleLabel = t(`dynoIntel.console.${route.consoleLabelKey}`);

  const weightSimTargetKg = useMemo(
    () => resolveWeightSimulationTargetKg(buildRadarInput().profile),
    [buildRadarInput]
  );

  const requestPaywallForPro = useCallback(() => {
    openPaywall('pro-required');
  }, [openPaywall]);

  const chips = useMemo((): DynoIntelChipView[] => {
    const proFull = canUseDynoIntelFull(entitlement, authStatus, isAnonymous);
    const send = chat.sendQuestion;
    const weightSimLabel =
      weightSimTargetKg != null
        ? t('dynoIntel.chips.weightSim', { kg: weightSimTargetKg })
        : t('dynoIntel.chips.weightSim', { kg: '—' });
    return [
      {
        id: 'axis-brief',
        label: t('dynoIntel.chips.axisBrief'),
        mode: 'single-axis',
        locked: false,
        onSelect: () => {
          void send(t('dynoIntel.questions.axisBrief'), undefined, 'single-axis');
        },
      },
      {
        id: 'weakest',
        label: t('dynoIntel.chips.weakestLink'),
        mode: 'cross-axis',
        locked: !proFull,
        onSelect: () => {
          if (!proFull) {
            requestPaywallForPro();
            return;
          }
          void send(t('dynoIntel.questions.weakestLink'), 'system_v1', 'cross-axis');
        },
      },
      {
        id: 'momentum',
        label: t('dynoIntel.chips.momentum'),
        mode: 'cross-axis',
        locked: !proFull,
        onSelect: () => {
          if (!proFull) {
            requestPaywallForPro();
            return;
          }
          void send(t('dynoIntel.questions.momentum'), undefined, 'cross-axis');
        },
      },
      {
        id: 'weight-sim',
        label: weightSimLabel,
        mode: 'weight-simulation',
        locked: !proFull,
        onSelect: () => {
          if (!proFull) {
            requestPaywallForPro();
            return;
          }
          const target = resolveWeightSimulationTargetKg(buildRadarInput().profile);
          if (target == null) {
            chat.showError('dynoIntel.error.weightProfileMissing');
            return;
          }
          void send(t('dynoIntel.questions.weightSim'), undefined, 'weight-simulation');
        },
      },
    ];
  }, [
    authStatus,
    buildRadarInput,
    chat.sendQuestion,
    chat.showError,
    entitlement,
    isAnonymous,
    requestPaywallForPro,
    t,
    weightSimTargetKg,
  ]);

  const openSheetWithGate = useCallback(() => {
    const entry = resolveDynoIntelSheetEntry(
      route.suggestedMode,
      entitlement,
      authStatus,
      isAnonymous
    );
    if (!entry.access.allowed) {
      if (entry.access.blockReason === 'auth') {
        handleAuthBlocked();
        return;
      }
      if (entry.access.blockReason === 'core-required') {
        handleCoreRequired();
        return;
      }
      openPaywall('pro-required');
      return;
    }
    setSheetView('chat');
    setMode(entry.openMode);
    chat.clearChat();
    sheet.openSheet();
  }, [
    authStatus,
    chat,
    entitlement,
    handleAuthBlocked,
    handleCoreRequired,
    isAnonymous,
    openPaywall,
    route.suggestedMode,
    sheet,
  ]);

  const handleModeChange = useCallback(
    (next: DynoIntelMode) => {
      if (next !== 'single-axis' && !canUseDynoIntelFull(entitlement, authStatus, isAnonymous)) {
        openPaywall('pro-required');
        return;
      }
      setMode(next);
      chat.clearChat();
    },
    [authStatus, chat, entitlement, isAnonymous, openPaywall]
  );

  const handleSheetClose = useCallback(() => {
    sheet.closeSheet();
    setSheetView('chat');
    setPaywallBillingError(false);
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
        setPaywallBillingError(true);
        return;
      }
      await useEntitlementStore.getState().refreshEntitlement();
      setSheetView('chat');
      chat.clearChat();
    } finally {
      setPaywallBusy(false);
    }
  }, [chat]);

  const hideTrigger = isShellBlocked || HIDDEN_TRIGGER_ROUTES.has(pathname);

  return (
    <>
      <DynoActiveTrigger
        consoleLabel={consoleLabel}
        onPress={openSheetWithGate}
        hidden={hideTrigger}
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
        mode={mode}
        onModeChange={handleModeChange}
        entitlement={entitlement}
        commentary={chat.visibleText}
        actionDirective={chat.actionDirective}
        status={chat.status}
        errorMessage={chat.errorMessageKey ? t(chat.errorMessageKey) : null}
        chips={chips}
        onSubmitQuestion={(question) => void chat.sendQuestion(question, undefined, mode)}
      />
      <LeaderboardGateSheet
        open={authGateOpen}
        kind="auth"
        description={t('dynoIntel.gate.authDescription')}
        secondaryLabel={t('gateSheet.secondary')}
        onPrimary={() => {
          setAuthGateOpen(false);
          navigateFromUiGate(navigate, { kind: 'auth' });
        }}
        onSecondary={() => setAuthGateOpen(false)}
      />
    </>
  );
};

export default DynoIntelConsole;
