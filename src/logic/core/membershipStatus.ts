import type { EntitlementState } from '../../types/entitlement';
import { hasProAccess, isValidActiveProExpiry } from './entitlement';
import { MS_PER_DAY, remainingPromoCreditMs, resolveEffectiveProExpiryMs } from './proExpiry';

export type MembershipCardKind = 'free' | 'promo' | 'store';

export type MembershipStatusView = {
  kind: MembershipCardKind;
  /** Device-local `YYYY/MM/DD`; Free is null. */
  displayDate: string | null;
  /** Promo remaining days only; always >= 0. Store/Free are null. */
  remainingDays: number | null;
  /** True when store billing is live and unused gift credit is frozen. */
  promoPaused: boolean;
};

export const FREE_MEMBERSHIP_STATUS: MembershipStatusView = {
  kind: 'free',
  displayDate: null,
  remainingDays: null,
  promoPaused: false,
};

/**
 * Device-local calendar day as `YYYY/MM/DD`.
 * WHY: UTC ISO slices (`toISOString().slice(0, 10)`) shift the calendar day around
 * timezone offsets — evening in US, early morning in UTC+8 — and would show the
 * wrong membership expiry on Settings.
 */
export function formatLocalYmd(input: Date | string | number | null | undefined): string | null {
  const date = toValidDate(input);
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/**
 * Remaining whole days, rounded up so a last partial day still reads as 1.
 * Negative spans clamp to 0 — expired stamps must never surface as "-X 天".
 */
export function remainingDaysFromMs(expiryMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((expiryMs - nowMs) / MS_PER_DAY));
}

/**
 * Settings / paywall membership card projection.
 *
 * WHY: Store billing date and stacked `effectiveUntil` (store + frozen gift) must
 * not mix. Showing the stacked end as "next charge" makes a paused 60-day invite
 * look like extra paid period — the trust failure this card exists to prevent.
 */
export function resolveMembershipStatus(
  ent: EntitlementState,
  now: Date = new Date()
): MembershipStatusView {
  if (!hasProAccess(ent, now)) {
    return FREE_MEMBERSHIP_STATUS;
  }

  if (isValidActiveProExpiry(ent.proExpiresAt, now)) {
    return {
      kind: 'store',
      displayDate: formatLocalYmd(ent.proExpiresAt),
      remainingDays: null,
      promoPaused: remainingPromoCreditMs(ent, now) > 0,
    };
  }

  const expiryMs = resolveEffectiveProExpiryMs(ent, now);
  const nowMs = now.getTime();
  // WHY: Defense in depth — hasProAccess already rejected elapsed stamps, but a
  // clock-skewed effectiveUntil must still degrade to Free instead of "-N 天".
  if (expiryMs == null || expiryMs < nowMs) {
    return FREE_MEMBERSHIP_STATUS;
  }

  return {
    kind: 'promo',
    displayDate: formatLocalYmd(expiryMs),
    remainingDays: remainingDaysFromMs(expiryMs, nowMs),
    promoPaused: false,
  };
}

function toValidDate(input: Date | string | number | null | undefined): Date | null {
  if (input == null) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return null;
    const fromMs = new Date(input);
    return Number.isNaN(fromMs.getTime()) ? null : fromMs;
  }
  if (typeof input !== 'string' || !input.trim()) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
