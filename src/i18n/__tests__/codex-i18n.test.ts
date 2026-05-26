import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { zhHantCommon } from '../locales/common';

describe('codex i18n runtime', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('merged bundle has tools.codex', () => {
    const tools = zhHantCommon.tools as { codex?: { panelTitle: string } };
    expect(tools.codex?.panelTitle).toContain('載具');
  });

  it('t resolves tools.codex keys', () => {
    const v = i18n.t('tools.codex.panelTitle', { ns: 'common' });
    expect(v).not.toBe('tools.codex.panelTitle');
    expect(v).toContain('載具');
  });

  it('t resolves tab and system labels', () => {
    expect(i18n.t('tools.codex.tabs.explosivePower', { ns: 'common' })).toBe('EXPLOSIVE');
    expect(i18n.t('tools.codex.systems.explosivePower', { ns: 'common' })).toContain('馬力');
  });
});
