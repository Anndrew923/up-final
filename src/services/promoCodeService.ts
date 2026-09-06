import { httpsCallable } from 'firebase/functions';
import { getFirebaseAuth, getFirebaseFunctions } from './firebaseClient';

export type RedeemPromoCodeReason =
  | 'auth-required'
  | 'unavailable'
  | 'invalid'
  | 'expired'
  | 'already-redeemed'
  | 'self-redeem'
  | 'failed';

export type RedeemPromoCodeResult =
  | {
      ok: true;
      promoExpiresAt: string;
      grantDays: number;
      attributionEndsAt: string;
    }
  | { ok: false; reason: RedeemPromoCodeReason };

type RedeemPromoCallableResponse = {
  ok: boolean;
  promoExpiresAt?: string;
  grantDays?: number;
  attributionEndsAt?: string;
  error?: string;
};

let redeemFn: ReturnType<
  typeof httpsCallable<{ code: string }, RedeemPromoCallableResponse>
> | null = null;

function getRedeemCallable() {
  if (!redeemFn) {
    const functions = getFirebaseFunctions();
    if (!functions) return null;
    redeemFn = httpsCallable(functions, 'redeemPromoCode');
  }
  return redeemFn;
}

function mapCallableError(code: string): RedeemPromoCodeReason {
  if (code.includes('unauthenticated')) return 'auth-required';
  if (code.includes('already-exists') || code.includes('already-redeemed')) {
    return 'already-redeemed';
  }
  if (code.includes('failed-precondition') && code.includes('expired')) return 'expired';
  if (code.includes('failed-precondition') && code.includes('self')) return 'self-redeem';
  if (code.includes('not-found') || code.includes('invalid')) return 'invalid';
  return 'failed';
}

/**
 * Redeems an invite / referral code via Callable (server writes attribution + promoExpiresAt).
 */
export async function redeemPromoCode(rawCode: string): Promise<RedeemPromoCodeResult> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser || auth.currentUser.isAnonymous) {
    return { ok: false, reason: 'auth-required' };
  }

  const code = rawCode.trim();
  if (!code) {
    return { ok: false, reason: 'invalid' };
  }

  const callable = getRedeemCallable();
  if (!callable) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const result = await callable({ code });
    const data = result.data;
    if (
      !data?.ok ||
      typeof data.promoExpiresAt !== 'string' ||
      typeof data.grantDays !== 'number' ||
      typeof data.attributionEndsAt !== 'string'
    ) {
      const err = typeof data?.error === 'string' ? data.error : '';
      return { ok: false, reason: mapCallableError(err || 'failed') };
    }
    return {
      ok: true,
      promoExpiresAt: data.promoExpiresAt,
      grantDays: data.grantDays,
      attributionEndsAt: data.attributionEndsAt,
    };
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : '';
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: string }).message)
        : '';
    return { ok: false, reason: mapCallableError(`${code} ${message}`) };
  }
}
