/**
 * DEV-only Callable diagnostics.
 * WHY: Production UI stays user-friendly; engineers need `HttpsError.details` in console.
 */
export function logLadderCallableError(label: string, err: unknown): void {
  if (!import.meta.env.DEV) return;

  const base =
    err && typeof err === 'object'
      ? {
          name: 'name' in err ? String(err.name) : undefined,
          code: 'code' in err ? String((err as { code?: unknown }).code) : undefined,
          message: 'message' in err ? String((err as { message?: unknown }).message) : undefined,
          details: 'details' in err ? (err as { details?: unknown }).details : undefined,
          customData:
            'customData' in err ? (err as { customData?: unknown }).customData : undefined,
        }
      : { raw: err };

  console.warn(`[ladder] ${label}`, base);
}
