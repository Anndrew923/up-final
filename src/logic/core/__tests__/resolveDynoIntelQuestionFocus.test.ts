import { describe, expect, it } from 'vitest';
import {
  detectQuestionFocusAxis,
  resolveDynoQuestionIntent,
  shouldPreferQuestionFocusClosing,
} from '../resolveDynoIntelQuestionFocus';

describe('resolveDynoIntelQuestionFocus', () => {
  it('detects methodology intent from scoring questions', () => {
    expect(resolveDynoQuestionIntent('FFMI 公式怎麼算？')).toBe('methodology');
    expect(resolveDynoQuestionIntent('How is strength score calculated?')).toBe('methodology');
    expect(resolveDynoQuestionIntent('力量評測標準是什麼？')).toBe('methodology');
    expect(resolveDynoQuestionIntent('計分依據是什麼')).toBe('methodology');
    expect(resolveDynoQuestionIntent('What is the scoring logic?')).toBe('methodology');
    expect(resolveDynoQuestionIntent('evaluation criteria for grip')).toBe('methodology');
  });

  it('does not misclassify score-status questions as methodology', () => {
    expect(resolveDynoQuestionIntent('我的評分多少？')).toBe('general');
  });

  it('detects progress intent and deprioritizes question-focus closing', () => {
    expect(resolveDynoQuestionIntent('有進步嗎？')).toBe('progress');
    expect(
      shouldPreferQuestionFocusClosing('有進步嗎？', { focusAxis: 'strength', mode: 'single-axis' })
    ).toBe(false);
  });

  it('detects bodyFat axis from FFMI / body-fat wording', () => {
    expect(
      detectQuestionFocusAxis('我的 FFMI 9% 體脂算多少分？', {
        focusAxis: null,
        mode: 'cross-axis',
        focusAxisLexicon: null,
      })
    ).toBe('bodyFat');
  });

  it('prefers question-focus closing for status and methodology intents', () => {
    expect(
      shouldPreferQuestionFocusClosing('幫我解讀狀態', { focusAxis: null, mode: 'cross-axis' })
    ).toBe(true);
    expect(
      shouldPreferQuestionFocusClosing('握力怎麼給分', { focusAxis: null, mode: 'cross-axis' })
    ).toBe(true);
  });
});
