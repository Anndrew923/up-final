import type { UiGateKind } from '../logic/core/entitlement';
import type { JoinArenaFrom } from '../types/uiGate';
import { isProSubscribeFunnel } from './joinArenaNavigation';

/** Arena i18n keys used by the Join Arena floating primary CTA. */
export type JoinArenaPrimaryCtaKey =
  | 'billingLoading'
  | 'confirmSubscribePro'
  | 'signInToSubscribePro'
  | 'returnToHome'
  | 'appleLogin'
  | 'googleLogin'
  | 'unlockProCloudSync'
  | 'subscribeUnlockPro'
  | 'subscribeUnlockProDynoIntel'
  | 'returnToDynoIntel'
  | 'returnToCloudSync'
  | 'betaEnterLeaderboard'
  | 'betaEnterArena'
  | 'enterLeaderboard';

export interface ResolveJoinArenaPrimaryCtaInput {
  from: JoinArenaFrom | null;
  busy: boolean;
  showPlanPicker: boolean;
  promoOnlyConvert: boolean;
  uiGateKind: UiGateKind;
  showAppleSignIn: boolean;
  isBetaOpen: boolean;
}

/**
 * Pure CTA copy resolver — ladder early-bird vs paid Pro subscribe funnels stay isolated.
 * WHY: When plan picker is visible on a Pro subscribe funnel, always surface paid copy even if
 * uiGate is `none` (genesis / open ladder access must not read as "free enter").
 */
export function resolveJoinArenaPrimaryCtaKey(
  input: ResolveJoinArenaPrimaryCtaInput
): JoinArenaPrimaryCtaKey {
  const {
    from,
    busy,
    showPlanPicker,
    promoOnlyConvert,
    uiGateKind,
    showAppleSignIn,
    isBetaOpen,
  } = input;

  if (busy) return 'billingLoading';

  const proSubscribe = isProSubscribeFunnel(from);
  const isBackupFunnel = from === 'backup';
  const isDynoFunnel = from === 'dyno-intel';
  const isProUpsellFunnel = from === 'pro-upsell';

  // Paid funnel + checkout UI visible → always paid CTA (even when ladder gate is open/`none`).
  if (proSubscribe && showPlanPicker) {
    if (isBackupFunnel) return 'unlockProCloudSync';
    if (isDynoFunnel) return 'subscribeUnlockProDynoIntel';
    return 'confirmSubscribePro';
  }

  if (promoOnlyConvert) {
    if (isBackupFunnel) return 'unlockProCloudSync';
    if (isProUpsellFunnel) return 'confirmSubscribePro';
    return 'subscribeUnlockPro';
  }

  if (isDynoFunnel) {
    if (uiGateKind === 'auth') return showAppleSignIn ? 'appleLogin' : 'googleLogin';
    if (uiGateKind === 'none') return 'returnToDynoIntel';
    return 'subscribeUnlockProDynoIntel';
  }

  if (isProUpsellFunnel) {
    if (uiGateKind === 'auth') {
      return showAppleSignIn ? 'appleLogin' : 'signInToSubscribePro';
    }
    // Already entitled (store Pro) — disabled CTA should resume home, not keep selling.
    if (uiGateKind === 'none') return 'returnToHome';
    return 'confirmSubscribePro';
  }

  if (uiGateKind === 'auth') {
    if (showAppleSignIn) return 'appleLogin';
    return isBackupFunnel
      ? 'googleLogin'
      : isBetaOpen
        ? 'betaEnterLeaderboard'
        : 'googleLogin';
  }

  if (uiGateKind === 'none') {
    return isBackupFunnel
      ? 'returnToCloudSync'
      : isBetaOpen
        ? 'betaEnterArena'
        : 'enterLeaderboard';
  }

  return isBackupFunnel ? 'unlockProCloudSync' : 'subscribeUnlockPro';
}
