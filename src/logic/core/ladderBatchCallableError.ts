/**
 * Maps Firebase Callable / App Check failures into UI-facing ladder batch reasons.
 * WHY: Production must never swallow App Check / auth errors as empty `failures[]`.
 */

export type LadderBatchCallableFailureReason =
  | 'app-check'
  | 'unauthenticated'
  | 'permission-denied'
  | 'internal'
  | 'unknown';

export type LadderBatchCallableErrorMapped = {
  reason: LadderBatchCallableFailureReason;
  message: string;
};

export type LadderBatchCallableErrorContext = {
  /**
   * True when the client still has a non-anonymous Firebase user.
   * WHY: Functions `enforceAppCheck` often returns bare `unauthenticated` (no "App Check"
   * in the message). If JS Auth is healthy, that 401 is almost always attestation — not a
   * missing Google session — and the UI must not tell testers to "sign in again".
   */
  hasGoogleSignedInUser?: boolean;
};

function readErrorCode(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const code = 'code' in err ? String((err as { code?: unknown }).code ?? '') : '';
  return code.trim().toLowerCase();
}

function readErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err ?? 'Ladder batch callable failed');
  if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Ladder batch callable failed';
}

/** Normalize `functions/failed-precondition` → `failed-precondition`. */
export function normalizeFirebaseCallableErrorCode(code: string): string {
  const trimmed = code.trim().toLowerCase();
  return trimmed.startsWith('functions/') ? trimmed.slice('functions/'.length) : trimmed;
}

export function mapLadderBatchCallableError(
  err: unknown,
  context: LadderBatchCallableErrorContext = {}
): LadderBatchCallableErrorMapped {
  const rawCode = readErrorCode(err);
  const code = normalizeFirebaseCallableErrorCode(rawCode);
  const message = readErrorMessage(err);
  const haystack = `${code} ${message}`.toLowerCase();

  if (
    code === 'failed-precondition' ||
    haystack.includes('app check') ||
    haystack.includes('appcheck') ||
    haystack.includes('attestation') ||
    haystack.includes('play integrity')
  ) {
    return {
      reason: 'app-check',
      message: message || 'App Check token missing or rejected',
    };
  }

  if (code === 'unauthenticated') {
    if (context.hasGoogleSignedInUser) {
      return {
        reason: 'app-check',
        message:
          message ||
          'Callable rejected while signed in — usually App Check / Play Integrity attestation',
      };
    }
    return {
      reason: 'unauthenticated',
      message: message || 'Sign in required for ladder sync',
    };
  }

  if (code === 'permission-denied') {
    return {
      reason: 'permission-denied',
      message: message || 'Permission denied for ladder sync',
    };
  }

  if (code === 'internal' || code === 'unavailable' || code === 'deadline-exceeded') {
    return {
      reason: 'internal',
      message: message || 'Ladder sync callable failed',
    };
  }

  return {
    reason: 'unknown',
    message: message || (rawCode ? `Callable error (${rawCode})` : 'Ladder sync callable failed'),
  };
}
