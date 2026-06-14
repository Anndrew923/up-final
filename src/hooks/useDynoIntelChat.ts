import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DYNO_INTEL_DEFAULT_PROMPT_TEMPLATE_ID } from '../config/dynoIntel';
import { canUseDynoIntelFull, resolveDynoIntelAccess } from '../logic/core/dynoIntelGates';
import type { DynoIntelChatResponseV1, DynoIntelContextV1, DynoIntelMode } from '../logic/core/dynoIntelTypes';
import { requestDynoIntelChat } from '../services/dynoIntelService';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { selectEntitlementState } from '../stores/entitlementSelectors';
import { useTypewriterText } from './useTypewriterText';
import type { DynoIntelQuotaState } from './useDynoIntelQuota';
import type { DynoIntelPaywallReason } from '../types/dynoIntelPaywall';

export type DynoIntelChatStatus = 'idle' | 'loading' | 'typing' | 'error';

export interface UseDynoIntelChatInput {
  mode: DynoIntelMode;
  resolveContext: (mode: DynoIntelMode) => DynoIntelContextV1;
  quota: Pick<DynoIntelQuotaState, 'applyServerQuota' | 'remaining'>;
  onPaywallRequest: (reason: DynoIntelPaywallReason) => void;
  onAuthBlocked: () => void;
  onCoreRequired: () => void;
}

export function useDynoIntelChat(input: UseDynoIntelChatInput) {
  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));

  const { visibleText, play, reset, cancel } = useTypewriterText({ charIntervalMs: 18 });
  const [status, setStatus] = useState<DynoIntelChatStatus>('idle');
  const [errorMessageKey, setErrorMessageKey] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<DynoIntelChatResponseV1 | null>(null);

  const sendQuestion = useCallback(
    async (
      userQuestion: string,
      promptTemplateId = DYNO_INTEL_DEFAULT_PROMPT_TEMPLATE_ID,
      modeOverride?: DynoIntelMode
    ) => {
      const effectiveMode = modeOverride ?? input.mode;
      const access = resolveDynoIntelAccess(
        effectiveMode,
        entitlement,
        authStatus,
        isAnonymous
      );

      if (!access.allowed) {
        if (access.blockReason === 'auth') {
          input.onAuthBlocked();
          return;
        }
        if (access.blockReason === 'core-required') {
          input.onCoreRequired();
          return;
        }
        input.onPaywallRequest('pro-required');
        return;
      }

      if (input.quota.remaining <= 0) {
        if (canUseDynoIntelFull(entitlement, authStatus, isAnonymous)) {
          setErrorMessageKey('dynoIntel.error.quotaExhaustedPro');
          setStatus('error');
          return;
        }
        input.onPaywallRequest('quota-exhausted');
        return;
      }

      const context = input.resolveContext(effectiveMode);

      setStatus('loading');
      setErrorMessageKey(null);
      cancel();
      reset();

      try {
        const result = await requestDynoIntelChat({
          context: { ...context, mode: effectiveMode },
          promptTemplateId,
          userQuestion,
          mode: effectiveMode,
        });

        if (!result.ok) {
          if (result.reason === 'quota-exhausted') {
            if (result.remaining != null && result.limit != null && result.resetAt) {
              input.quota.applyServerQuota({
                remaining: result.remaining,
                limit: result.limit,
                resetAt: result.resetAt,
              });
            }
            if (canUseDynoIntelFull(entitlement, authStatus, isAnonymous)) {
              setErrorMessageKey('dynoIntel.error.quotaExhaustedPro');
              setStatus('error');
            } else {
              input.onPaywallRequest('quota-exhausted');
              setStatus('idle');
            }
            return;
          }
          if (result.reason === 'pro-required') {
            input.onPaywallRequest('pro-required');
            setStatus('idle');
            return;
          }
          if (result.reason === 'core-required') {
            input.onCoreRequired();
            setStatus('idle');
            return;
          }
          setStatus('idle');
          return;
        }

        input.quota.applyServerQuota({
          remaining: result.remaining,
          limit: result.limit,
          resetAt: result.resetAt,
        });

        setLastReply(result.reply);
        setStatus('typing');
        await play(result.reply.commentary);
        setStatus('idle');
      } catch (error) {
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
    [authStatus, cancel, entitlement, input, isAnonymous, play, reset]
  );

  const clearChat = useCallback(() => {
    cancel();
    reset();
    setErrorMessageKey(null);
    setLastReply(null);
    setStatus('idle');
  }, [cancel, reset]);

  const showError = useCallback(
    (messageKey: string) => {
      cancel();
      reset();
      setLastReply(null);
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
    sendQuestion,
    clearChat,
    showError,
  };
}
