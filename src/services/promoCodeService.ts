import { httpsCallable } from 'firebase/functions';
import { getFirebaseAuth, getFirebaseFunctions } from './firebaseClient';

export type RedeemPromoCodeReason =
  | 'auth-required'
  | 'unavailable'
  | 'invalid'
  | 'expired'
  | 'already-redeemed'
  | 'self-redeem'
  | 'rate-limited'
  | 'exhausted'
  | 'app-check'
  | 'failed';

export type RedeemPromoCodeResult =
  | {
      ok: true;
      promoExpiresAt: string;
      grantDays: number;
      attributionEndsAt: string;
    }
  | { ok: false; reason: RedeemPromoCodeReason };

export type MapRedeemPromoCallableErrorContext = {
  /**
   * True when JS Auth still has a non-anonymous user.
   * WHY: enforceAppCheck often returns bare `unauthenticated` — must not show "sign in".
   */
  hasGoogleSignedInUser?: boolean;
};

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

/**
 * Map Firebase Callable error code+message into UI reasons.
 * WHY: `functions/resource-exhausted` contains the substring "exhausted" — never match on that alone.
 */
export function mapRedeemPromoCallableError(
  raw: string,
  context: MapRedeemPromoCallableErrorContext = {}
): RedeemPromoCodeReason {
  const text = raw.toLowerCase();
  if (
    text.includes('app check') ||
    text.includes('appcheck') ||
    text.includes('attestation')
  ) {
    return 'app-check';
  }
  if (text.includes('unauthenticated')) {
    // Align with ladderBatchCallableError: signed-in + 401 ≈ App Check, not missing session.
    if (context.hasGoogleSignedInUser) return 'app-check';
    return 'auth-required';
  }
  if (text.includes('already-exists') || text.includes('already-redeemed')) {
    return 'already-redeemed';
  }
  if (text.includes('resource-exhausted')) {
    if (text.includes('rate-limited') || text.includes('promo-redeem-rate-limited')) {
      return 'rate-limited';
    }
    if (text.includes('promo-code-exhausted')) return 'exhausted';
    // Ambiguous resource-exhausted without a known detail — fail closed to generic UX.
    return 'failed';
  }
  if (text.includes('failed-precondition') && text.includes('expired')) return 'expired';
  if (text.includes('failed-precondition') && text.includes('self')) return 'self-redeem';
  if (text.includes('not-found') || text.includes('invalid')) return 'invalid';
  return 'failed';
}

/**
 * Redeems an invite / referral code via Callable (server writes attribution + promoExpiresAt).
 */
export async function redeemPromoCode(rawCode: string): Promise<RedeemPromoCodeResult> {
  const auth = getFirebaseAuth();
  const functions = getFirebaseFunctions();
  const signedInUser = auth?.currentUser;
  const hasGoogleSignedInUser = Boolean(signedInUser && !signedInUser.isAnonymous);

  if (import.meta.env.DEV) {
    console.warn('[PromoDebug] Entry:', {
      hasFunctions: Boolean(functions),
      uid: signedInUser?.uid ?? null,
      isAnonymous: signedInUser?.isAnonymous ?? null,
    });
  }

  if (!signedInUser || signedInUser.isAnonymous) {
    return { ok: false, reason: 'auth-required' };
  }

  const code = rawCode.trim();
  if (!code) {
    return { ok: false, reason: 'invalid' };
  }

  const callable = getRedeemCallable();
  if (!callable) {
    if (import.meta.env.DEV) {
      console.warn('[PromoDebug] Guard: unavailable (firebaseFunctions not initialized)');
    }
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
      return {
        ok: false,
        reason: mapRedeemPromoCallableError(err || 'failed', { hasGoogleSignedInUser }),
      };
    }
    return {
      ok: true,
      promoExpiresAt: data.promoExpiresAt,
      grantDays: data.grantDays,
      attributionEndsAt: data.attributionEndsAt,
    };
  } catch (err: unknown) {
    const errCode =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : '';
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: string }).message)
        : '';
    return {
      ok: false,
      reason: mapRedeemPromoCallableError(`${errCode} ${message}`, {
        hasGoogleSignedInUser,
      }),
    };
  }
}
