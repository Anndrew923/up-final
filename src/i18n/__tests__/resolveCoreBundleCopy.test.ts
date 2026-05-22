import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { resolveIdentityString } from '../resolveCoreBundleCopy';

describe('resolveCoreBundleCopy', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('resolves identity.liveSpecKicker for zh-Hant', () => {
    const kicker = resolveIdentityString(i18n.t.bind(i18n), 'liveSpecKicker');
    expect(kicker).toContain('實時載具規格');
    expect(kicker).not.toContain('identity.liveSpec');
  });
});
