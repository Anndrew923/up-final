import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import {
  formatOnboardingBaselineFeatureLabel,
  resolveOnboardingBaselineCopy,
} from '../resolveOnboardingBaselineCopy';
import { enCommon, zhHantCommon } from '../locales/common';

describe('onboarding baseline i18n', () => {
  it('merged bundles expose baseline copy for both locales', () => {
    const zhOnboarding = zhHantCommon.onboarding as {
      baseline?: { protocolTitle?: string };
    };
    const enOnboarding = enCommon.onboarding as {
      baseline?: { protocolTitle?: string };
    };
    expect(zhOnboarding.baseline?.protocolTitle).toContain('統一測功');
    expect(enOnboarding.baseline?.protocolTitle).toContain('UNIFIED DYNO');
  });

  describe('zh-Hant', () => {
    beforeAll(async () => {
      await i18n.changeLanguage('zh-Hant');
    });

    it('resolveOnboardingBaselineCopy returns protocol copy', () => {
      const copy = resolveOnboardingBaselineCopy(i18n.t.bind(i18n));
      expect(copy.protocolTitle).toContain('統一測功');
      expect(copy.protocolTitle).not.toContain('onboarding.baseline');
      expect(copy.features.strength.label).toContain('力量');
      expect(copy.features.ffmi.desc).toContain('FFMI');
      expect(copy.authorityFooter).toContain('警告');
    });

    it('formatOnboardingBaselineFeatureLabel uses CJK brackets', () => {
      expect(formatOnboardingBaselineFeatureLabel('力量／底盤應力', 'zh-Hant')).toBe(
        '【力量／底盤應力】'
      );
    });
  });

  describe('en', () => {
    beforeAll(async () => {
      await i18n.changeLanguage('en');
    });

    it('resolveOnboardingBaselineCopy returns protocol copy', () => {
      const copy = resolveOnboardingBaselineCopy(i18n.t.bind(i18n));
      expect(copy.protocolTitle).toContain('UNIFIED DYNO');
      expect(copy.features.strength.label).toContain('CHASSIS');
      expect(copy.features.skeletalMuscle.label).toContain('EXTERIOR');
      expect(copy.authorityFooter).toContain('WARNING');
    });

    it('formatOnboardingBaselineFeatureLabel uses ASCII brackets', () => {
      expect(formatOnboardingBaselineFeatureLabel('CHASSIS / HP', 'en')).toBe('[CHASSIS / HP]');
    });
  });
});
