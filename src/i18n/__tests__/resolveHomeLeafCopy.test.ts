import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { resolveHomeLeafString } from '../resolveHomeLeafCopy';

describe('resolveHomeLeafCopy', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('resolves home.overallAverage for zh-Hant', () => {
    const label = resolveHomeLeafString(i18n.t.bind(i18n), 'overallAverage');
    expect(label).toContain('性能指數');
    expect(label).not.toContain('home.overallAverage');
  });
});
