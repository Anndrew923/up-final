import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DYNO_INTEL_DEFAULT_PROMPT_TEMPLATE_ID, DYNO_INTEL_PRO_DAILY } from '../config/dynoIntel';
import { resolveDynoIntelAccess } from '../logic/core/dynoIntelGates';
import type { DynoIntelLogEntry } from '../logic/core/dynoIntelLogTypes';
import { resolveDynoIntelLogFocusAxis } from '../logic/core/resolveDynoIntelLogFocusAxis';
import { resolveDynoIntelPriorTurnFromLog } from '../logic/core/resolveDynoIntelPriorTurnFromLog';
import type {
  DynoIntelChatResponseV1,
  DynoIntelContextV1,
  DynoIntelMode,
  DynoIntelQuotaTier,
} from '../logic/core/dynoIntelTypes';
import {
  resolveDynoIntelDisplayMeta,
  type DynoIntelDisplayMeta,
} from '../logic/core/resolveDynoIntelDisplayMeta';
import { requestDynoIntelChat } from '../services/dynoIntelService';
import { useAuthStore } from '../stores/authStore';
import { useDynoIntelLogStore } from '../stores/dynoIntelLogStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { selectEntitlementState } from '../stores/entitlementSelectors';
import { useTypewriterText } from './useTypewriterText';
import type { DynoIntelQuotaState } from './useDynoIntelQuota';
import type { DynoIntelPaywallReason } from '../types/dynoIntelPaywall';

export type DynoIntelChatStatus = 'idle' | 'loading' | 'typing' | 'error';

function resolveServerQuotaTier(
  quotaTier: unknown,
  limit: number | undefined,
  fallbackTier: DynoIntelQuotaTier
): DynoIntelQuotaTier {
  // Rolling deployments may briefly pair the new client with the legacy
  // response shape. Numeric inference is compatibility-only, not the contract.
  if (quotaTier === 'trial' || quotaTier === 'pro') return quotaTier;
  if (limit != null) return limit === DYNO_INTEL_PRO_DAILY ? 'pro' : 'trial';
  return fallbackTier;
}

export interface UseDynoIntelChatInput {
  mode: DynoIntelMode;
  resolveContext: (mode: DynoIntelMode) => DynoIntelContextV1;
  enrichContext: (base: DynoIntelContextV1, userQuestion: string) => DynoIntelContextV1;
  quota: Pick<
    DynoIntelQuotaState,
    'applyServerQuota' | 'remaining' | 'quotaTier' | 'syncToken' | 'isSynced' | 'isSyncTokenCurrent'
  >;
  onPaywallRequest: (reason: DynoIntelPaywallReason) => void;
  onAuthBlocked: () => void;
}

export function useDynoIntelChat(input: UseDynoIntelChatInput) {
  const authStatus = useAuthStore((s) => s.status);
  const uid = useAuthStore((s) => s.uid);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const appendLog = useDynoIntelLogStore((s) => s.appendLog);
  const getMostRecentLog = useDynoIntelLogStore((s) => s.getMostRecent);

  const { visibleText, play, reset, cancel, showImmediately } = useTypewriterText({
    charIntervalMs: 18,
  });
  const [status, setStatus] = useState<DynoIntelChatStatus>('idle');
  const [errorMessageKey, setErrorMessageKey] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<DynoIntelChatResponseV1 | null>(null);
  const [lastDisplayMeta, setLastDisplayMeta] = useState<DynoIntelDisplayMeta | null>(null);
  const previousUid = useRef(uid);
  const latestRequestSequence = useRef(0);

  useEffect(() => {
    if (previousUid.current === uid) return;
    previousUid.current = uid;
    latestRequestSequence.current += 1;
    cancel();
    reset();
    setStatus('idle');
    setErrorMessageKey(null);
    setLastReply(null);
    setLastDisplayMeta(null);
  }, [cancel, reset, uid]);

  const sendQuestion = useCallback(
    async (
      userQuestion: string,
      promptTemplateId = DYNO_INTEL_DEFAULT_PROMPT_TEMPLATE_ID,
      modeOverride?: DynoIntelMode
    ) => {
      const effectiveMode = modeOverride ?? input.mode;
      const requestSyncToken = input.quota.syncToken;
      const requestSequence = ++latestRequestSequence.current;
      const access = resolveDynoIntelAccess(effectiveMode, entitlement, authStatus, isAnonymous);

      if (!access.allowed) {
        if (access.blockReason === 'auth') {
          input.onAuthBlocked();
          return;
        }
        input.onPaywallRequest('pro-required');
        return;
      }

      if (input.quota.isSynced && input.quota.remaining <= 0) {
        if (input.quota.quotaTier === 'pro') {
          setErrorMessageKey('dynoIntel.error.quotaExhaustedPro');
          setStatus('error');
          return;
        }
        input.onPaywallRequest('quota-exhausted');
        return;
      }

      const context = input.enrichContext(input.resolveContext(effectiveMode), userQuestion);
      const displayMeta = resolveDynoIntelDisplayMeta(context, userQuestion);

      // WHY: CF cannot read on-device dynoIntelLog — attach newest turn so pantheon
      // consult can inherit axis/decade for anaphoric follow-ups ("這個區間還有誰").
      const priorTurn = resolveDynoIntelPriorTurnFromLog(getMostRecentLog());

      setStatus('loading');
      setErrorMessageKey(null);
      setLastDisplayMeta(displayMeta);
      cancel();
      reset();

      try {
        const result = await requestDynoIntelChat({
          context: { ...context, mode: effectiveMode },
          promptTemplateId,
          userQuestion,
          mode: effectiveMode,
          priorTurn,
        });
        if (
          useAuthStore.getState().uid !== uid ||
          latestRequestSequence.current !== requestSequence ||
          !input.quota.isSyncTokenCurrent(requestSyncToken)
        ) {
          return;
        }

        if (!result.ok) {
          if (result.reason === 'quota-exhausted') {
            const quotaTier = resolveServerQuotaTier(
              result.quotaTier,
              result.limit,
              input.quota.quotaTier
            );
            if (result.remaining != null && result.limit != null && result.resetAt) {
              input.quota.applyServerQuota(
                {
                  remaining: result.remaining,
                  limit: result.limit,
                  quotaTier,
                  resetAt: result.resetAt,
                },
                requestSyncToken
              );
            }
            // WHY: The server-returned quota tier is authoritative. Client
            // entitlement/bypass state can be stale and previously paired 0/2
            // with the Pro-only 30/day message.
            if (quotaTier === 'pro') {
              setErrorMessageKey('dynoIntel.error.quotaExhaustedPro');
              setStatus('error');
            } else {
              input.onPaywallRequest('quota-exhausted');
              setStatus('idle');
            }
            return;
          }
          if (result.reason === 'pro-required' || result.reason === 'core-required') {
            // WHY: Server may still emit legacy core-required; client constitution maps both to Pro paywall.
            input.onPaywallRequest('pro-required');
            setStatus('idle');
            return;
          }
          setStatus('idle');
          return;
        }

        input.quota.applyServerQuota(
          {
            remaining: result.remaining,
            limit: result.limit,
            quotaTier: resolveServerQuotaTier(
              result.quotaTier,
              result.limit,
              input.quota.quotaTier
            ),
            resetAt: result.resetAt,
          },
          requestSyncToken
        );

        setLastReply(result.reply);
        setStatus('typing');
        await play(result.reply.commentary);
        setStatus('idle');

        if (uid && !result.reply.is_off_topic) {
          appendLog({
            uid,
            focusAxis: resolveDynoIntelLogFocusAxis(context, effectiveMode),
            userQuestion,
            commentary: result.reply.commentary,
            closingBeatKind: context.closingBeatKind,
            displayMeta,
          });
        }
      } catch (error) {
        if (
          useAuthStore.getState().uid !== uid ||
          latestRequestSequence.current !== requestSequence ||
          !input.quota.isSyncTokenCurrent(requestSyncToken)
        ) {
          return;
        }
        const mappedKey =
          error instanceof Error &&
          error.name === 'DynoIntelCallableError' &&
          error.message.startsWith('dynoIntel.')
            ? error.message
            : null;
        setErrorMessageKey(mappedKey ?? 'dynoIntel.error.network');
        setStatus('error');
      }
    },
    [
      appendLog,
      authStatus,
      cancel,
      entitlement,
      getMostRecentLog,
      input,
      isAnonymous,
      play,
      reset,
      uid,
    ]
  );

  const restoreFromLog = useCallback(
    (entry: DynoIntelLogEntry) => {
      latestRequestSequence.current += 1;
      cancel();
      showImmediately(entry.commentary);
      setLastReply({
        commentary: entry.commentary,
        action_directive: '',
        is_off_topic: false,
        detected_weakest_axis: entry.focusAxis,
      });
      setLastDisplayMeta(entry.displayMeta ?? null);
      setErrorMessageKey(null);
      setStatus('idle');
    },
    [cancel, showImmediately]
  );

  const clearChat = useCallback(() => {
    latestRequestSequence.current += 1;
    cancel();
    reset();
    setErrorMessageKey(null);
    setLastReply(null);
    setLastDisplayMeta(null);
    setStatus('idle');
  }, [cancel, reset]);

  const showError = useCallback(
    (messageKey: string) => {
      latestRequestSequence.current += 1;
      cancel();
      reset();
      setLastReply(null);
      setLastDisplayMeta(null);
      setErrorMessageKey(messageKey);
      setStatus('error');
    },
    [cancel, reset]
  );

  return {
    status,
    visibleText,
    errorMessageKey,
    lastReply,
    lastDisplayMeta,
    sendQuestion,
    clearChat,
    restoreFromLog,
    showError,
  };
}
