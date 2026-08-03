/**
 * Detect store "already owned" errors from RevenueCat / Play Billing shapes.
 * WHY: Capacitor RC surfaces codes as strings, numbers, or nested info — match liberally.
 */
export function isProductAlreadyPurchasedError(error: unknown): boolean {
  if (error == null) return false;
  if (typeof error !== 'object') {
    return matchesAlreadyPurchasedText(String(error));
  }

  const record = error as Record<string, unknown>;
  const codeCandidates = [record.code, record.errorCode, record.error_code];
  for (const code of codeCandidates) {
    if (code == null) continue;
    const normalized = String(code).toUpperCase().replace(/[\s-]/g, '_');
    if (
      normalized.includes('PRODUCT_ALREADY_PURCHASED') ||
      normalized.includes('ALREADY_PURCHASED') ||
      normalized.includes('ITEM_ALREADY_OWNED') ||
      normalized.includes('ITEMAREADYOWNED') || // compacted Play / BillingClient codes
      normalized === '6' // legacy PurchasesErrorCode.PRODUCT_ALREADY_PURCHASED
    ) {
      return true;
    }
  }

  const messageCandidates = [
    record.message,
    record.underlyingErrorMessage,
    record.readableErrorCode,
  ];
  for (const message of messageCandidates) {
    if (typeof message === 'string' && matchesAlreadyPurchasedText(message)) {
      return true;
    }
  }

  if (record.info && typeof record.info === 'object') {
    return isProductAlreadyPurchasedError(record.info);
  }
  if (record.userInfo && typeof record.userInfo === 'object') {
    return isProductAlreadyPurchasedError(record.userInfo);
  }
  if (record.cause && typeof record.cause === 'object') {
    return isProductAlreadyPurchasedError(record.cause);
  }

  return false;
}

function matchesAlreadyPurchasedText(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('already been purchased') ||
    lower.includes('already purchased') ||
    lower.includes('already owned') ||
    lower.includes('item already owned') ||
    lower.includes('productalreadypurchased') ||
    lower.includes('product_already_purchased')
  );
}
