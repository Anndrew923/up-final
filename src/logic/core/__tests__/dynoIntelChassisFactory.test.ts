import { describe, expect, it } from 'vitest';
import {
  assembleSingleBeatCommentary,
  isMethodologyReplyContext,
  shouldUseChassisSynthesisPipeline,
} from '../dynoIntelChassisFactory';

describe('dynoIntelChassisFactory v3', () => {
  it('shouldUseChassisSynthesisPipeline gates whole-chassis macro reads', () => {
    expect(
      shouldUseChassisSynthesisPipeline({
        intent: 'status',
        closingBeatKind: 'return-ritual',
        mode: 'cross-axis',
        userQuestion: '我的總分成績如何？',
        questionFocusAxis: null,
      })
    ).toBe(true);
  });

  it('isMethodologyReplyContext detects methodology nudge', () => {
    expect(
      isMethodologyReplyContext({
        intent: 'methodology',
        closingBeatKind: 'methodology-nudge',
      })
    ).toBe(true);
  });

  it('assembleSingleBeatCommentary merges without blank-line separators', () => {
    const merged = assembleSingleBeatCommentary(
      '以同齡一般人來看，你的握力已高於業餘上限。',
      '下次硬拉記得把握把當成賽道彎道來咬。',
      'zh-Hant'
    );
    expect(merged).not.toMatch(/\n\n/);
    expect(merged).toMatch(/。$/);
  });
});
