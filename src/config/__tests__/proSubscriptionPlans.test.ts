import { describe, expect, it } from 'vitest';
import enDynoIntel from '../../i18n/locales/en/common/dynoIntel.json';
import zhDynoIntel from '../../i18n/locales/zh-Hant/common/dynoIntel.json';
import {
  DEFAULT_PRO_SUBSCRIPTION_PLAN,
  PRO_SUBSCRIPTION_PLANS,
  resolveProPaywallPriceVars,
} from '../proSubscriptionPlans';

const STALE_PRICE_MARKERS = ['NT$ 30', 'NT$30', '$1.00', '1.00 USD', '$0.99', '0.99 USD'] as const;

describe('PRO_SUBSCRIPTION_PLANS paywall SSOT', () => {
  it('locks marketing USD defaults used by Join Arena + Dyno fallbacks', () => {
    expect(PRO_SUBSCRIPTION_PLANS.monthly.priceUsd).toBe(1.99);
    expect(PRO_SUBSCRIPTION_PLANS.annual.priceUsd).toBe(14.99);
    expect(PRO_SUBSCRIPTION_PLANS.annual.monthlyEquivalentUsd).toBe(1.25);
    expect(DEFAULT_PRO_SUBSCRIPTION_PLAN).toBe('annual');
  });

  it('formats i18n vars as two-decimal strings without currency symbol', () => {
    expect(resolveProPaywallPriceVars()).toEqual({ monthly: '1.99', annual: '14.99' });
  });

  it('keeps Dyno paywall copy on interpolation — never stale hardcoded store prices', () => {
    for (const locale of [enDynoIntel, zhDynoIntel] as const) {
      const { price, cta } = locale.dynoIntel.paywall;
      expect(price).toContain('{{monthly}}');
      expect(price).toContain('{{annual}}');
      expect(cta).toContain('{{annual}}');
      for (const marker of STALE_PRICE_MARKERS) {
        expect(price, `price must not contain ${marker}`).not.toContain(marker);
        expect(cta, `cta must not contain ${marker}`).not.toContain(marker);
      }
    }
  });

  it('does not expose internal SKU ids as user-facing package copy', () => {
    expect(PRO_SUBSCRIPTION_PLANS.monthly.packageId).toBe('$rc_monthly');
    expect(PRO_SUBSCRIPTION_PLANS.annual.packageId).toBe('$rc_annual');
    // WHY: Legacy store product ids may still be `pro_monthly_099` — never surface in paywall strings.
    for (const locale of [enDynoIntel, zhDynoIntel] as const) {
      const blob = JSON.stringify(locale.dynoIntel.paywall);
      expect(blob).not.toContain('pro_monthly_099');
      expect(blob).not.toContain('pro_annual_1499');
    }
  });
});
