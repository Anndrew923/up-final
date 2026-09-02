export function getFirebaseAuthErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
}

export function getFirebaseAuthErrorDetails(error: unknown): { code: string; message: string } {
  const code = getFirebaseAuthErrorCode(error);
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message)
      : String(error);
  return { code, message };
}
