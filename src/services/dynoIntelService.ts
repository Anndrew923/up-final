import { httpsCallable } from 'firebase/functions';
import type { DynoIntelChatRequestV1, DynoIntelChatResponseV1 } from '../logic/core/dynoIntelTypes';
import { getFirebaseFunctions } from './firebaseClient';

export type DynoIntelChatResult =
  | {
      ok: true;
      fromCache: boolean;
      remaining: number;
      limit: number;
      resetAt: string;
      reply: DynoIntelChatResponseV1;
    }
  | {
      ok: false;
      reason: 'pro-required' | 'core-required' | 'quota-exhausted';
      remaining?: number;
      limit?: number;
      resetAt?: string;
    };

let dynoIntelChatFn: ReturnType<typeof httpsCallable<DynoIntelChatRequestV1, DynoIntelChatResult>> | null =
  null;

function getDynoIntelChatCallable() {
  if (!dynoIntelChatFn) {
    const functions = getFirebaseFunctions();
    if (!functions) {
      throw new Error('firebase-functions-unavailable');
    }
    dynoIntelChatFn = httpsCallable(functions, 'dynoIntelChat');
  }
  return dynoIntelChatFn;
}

function readFirebaseErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  const code = (error as { code?: string }).code;
  return typeof code === 'string' ? code : null;
}

function readFirebaseErrorMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('message' in error)) return null;
  const message = (error as { message?: string }).message;
  return typeof message === 'string' ? message : null;
}

/**
 * Maps Callable transport failures to i18n keys — avoids mislabeling Gemini/config 400s as generic network loss.
 */
export function mapDynoIntelCallableErrorToMessageKey(error: unknown): string | null {
  const code = readFirebaseErrorCode(error);
  const message = readFirebaseErrorMessage(error) ?? '';
  if (code === 'functions/failed-precondition') {
    return 'dynoIntel.error.geminiNotConfigured';
  }
  if (code === 'functions/invalid-argument') {
    return 'dynoIntel.error.invalidContext';
  }
  if (code === 'functions/unauthenticated') {
    return 'dynoIntel.gate.authDescription';
  }
  if (code === 'functions/resource-exhausted') {
    return 'dynoIntel.error.geminiQuotaExhausted';
  }
  if (code === 'functions/internal') {
    if (message.includes('DYNO_INTEL_INFERENCE_MALFORMED')) {
      return 'dynoIntel.error.inferenceMalformed';
    }
    if (message.includes('DYNO INTEL inference failed')) {
      return 'dynoIntel.error.inferenceFailed';
    }
  }
  return null;
}

/**
 * Sends de-identified context to the DYNO INTEL Cloud Function.
 * WHY: Components never touch Gemini or API keys — entitlement + quota live server-side.
 */
export async function requestDynoIntelChat(
  payload: DynoIntelChatRequestV1
): Promise<DynoIntelChatResult> {
  const callable = getDynoIntelChatCallable();
  try {
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    const messageKey = mapDynoIntelCallableErrorToMessageKey(error);
    if (messageKey) {
      const err = new Error(messageKey);
      err.name = 'DynoIntelCallableError';
      throw err;
    }
    throw error;
  }
}
