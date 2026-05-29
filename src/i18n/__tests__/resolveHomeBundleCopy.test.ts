import { describe, expect, it, beforeAll } from 'vitest';
import i18n from '../../i18n';
import {
  resolveHomeResonancePhase,
  resolveHomeSectionString,
  resolveHomeSubsectionString,
} from '../resolveHomeBundleCopy';

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

  it('resolves home.profile collapsible copy for zh-Hant', () => {
    const t = i18n.t.bind(i18n);
    expect(resolveHomeSubsectionString(t, 'profile', 'toggleCollapse')).toBe('點擊收合');
    expect(resolveHomeSubsectionString(t, 'profile', 'advancedExpand')).toBe('點擊展開進階欄位');
    expect(resolveHomeSubsectionString(t, 'profile', 'advancedCollapsedHint')).toContain('可選');
    expect(resolveHomeSubsectionString(t, 'ladderIdentity', 'toggleExpand')).toBe('點擊展開編輯');
    expect(
      resolveHomeSubsectionString(t, 'profile', 'collapsedSummary', {
        gender: '男',
        age: '28',
        height: '175',
        weight: '72',
      })
    ).toBe('男 · 28 歲 · 175 cm · 72 kg');
  });
});
