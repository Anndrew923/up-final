import { describe, expect, it, beforeAll } from 'vitest';
import i18n from '../../i18n';
import { resolveHomeResonancePhase, resolveHomeSectionString } from '../resolveHomeBundleCopy';

describe('resolveHomeBundleCopy', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('resolves home.resonance.reportTitle for zh-Hant', () => {
    const title = resolveHomeSectionString(i18n.t.bind(i18n), 'resonance', 'reportTitle');
    expect(title).toContain('全域性能規格報告');
    expect(title).not.toContain('home.resonance');
  });

  it('resolves home.resonance.phase.reveal for zh-Hant', () => {
    const line = resolveHomeResonancePhase(i18n.t.bind(i18n), 'reveal');
    expect(line).toContain('賽會認證');
    expect(line).not.toContain('home.resonance');
  });
});
