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

  it('interpolates home.resonance.homologationId', () => {
    const label = resolveHomeSectionString(i18n.t.bind(i18n), 'resonance', 'homologationId', {
      id: 9960,
    });
    expect(label).toBe('規格診斷報告 // #GT-9960');
  });

  it('resolves home.resonance.phase.reveal for zh-Hant', () => {
    const line = resolveHomeResonancePhase(i18n.t.bind(i18n), 'reveal');
    expect(line).toContain('賽會認證');
    expect(line).not.toContain('home.resonance');
  });

  it('resolves home.syncArrival.toast for zh-Hant', () => {
    const line = resolveHomeSectionString(i18n.t.bind(i18n), 'syncArrival', 'toast');
    expect(line).toBe('數據已同步 // 主控台已更新');
  });

  it('resolves home.profile collapsible copy for zh-Hant', () => {
    const t = i18n.t.bind(i18n);
    expect(resolveHomeSubsectionString(t, 'profile', 'toggleCollapse')).toBe('點擊收合');
    expect(resolveHomeSubsectionString(t, 'profile', 'advancedExpand')).toBe('點擊展開進階欄位');
    expect(resolveHomeSubsectionString(t, 'profile', 'advancedTitle')).toContain('天梯細分標籤');
    expect(resolveHomeSubsectionString(t, 'profile', 'advancedCollapsedHint')).toContain(
      '同儕篩選'
    );
    expect(resolveHomeSubsectionString(t, 'profile', 'ladderTagsPillEmpty')).toContain('職業');
    expect(resolveHomeSubsectionString(t, 'ladderIdentity', 'toggleExpand')).toBe('點擊展開編輯');
    expect(
      resolveHomeSubsectionString(t, 'profile', 'collapsedSummary', {
        gender: '男',
        age: '28',
        height: '175',
        heightUnit: 'cm',
        weight: '72',
        weightUnit: 'kg',
      })
    ).toBe('男 · 28 歲 · 175 cm · 72 kg');
  });
});
