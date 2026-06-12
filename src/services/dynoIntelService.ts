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

/**
 * Sends de-identified context to the DYNO INTEL Cloud Function.
 * WHY: Components never touch Gemini or API keys — entitlement + quota live server-side.
 */
export async function requestDynoIntelChat(
  payload: DynoIntelChatRequestV1
): Promise<DynoIntelChatResult> {
  const callable = getDynoIntelChatCallable();
  const result = await callable(payload);
  return result.data;
}
