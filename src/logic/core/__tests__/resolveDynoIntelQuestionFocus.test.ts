import { describe, expect, it } from 'vitest';
import {
  detectQuestionFocusAxis,
  isChassisMacroQuestion,
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
    expect(resolveDynoQuestionIntent('握力分數是如何評斷的？')).toBe('methodology');
    expect(resolveDynoQuestionIntent('握力怎麼給分')).toBe('methodology');
    expect(resolveDynoQuestionIntent('握力怎麼評測的？')).toBe('methodology');
  });

  it('defaults axis-only telemetry reads to status under v3.0.3', () => {
    expect(resolveDynoQuestionIntent('我的 FFMI 分數代表什麼？')).toBe('status');
  });

  it('escalates methodology via heuristic when regex misses but axis + probes hit', () => {
    expect(
      resolveDynoQuestionIntent('握力標準 how to read', {
        focusAxis: null,
        mode: 'cross-axis',
        focusAxisLexicon: null,
      })
    ).toBe('methodology');
  });

  it('routes axis panel-read questions to status under v3.0.3', () => {
    expect(
      resolveDynoQuestionIntent('我的握力標準how', {
        focusAxis: 'gripStrength',
        mode: 'single-axis',
        focusAxisLexicon: null,
      })
    ).toBe('status');
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

  it('maps full-width FFMI to bodyFat axis focus', () => {
    expect(detectQuestionFocusAxis('ＦＦＭＩ')).toBe('bodyFat');
  });

  it('routes my FFMI score panel-read to status not methodology', () => {
    expect(resolveDynoQuestionIntent('我的 FFMI 評分如何？')).toBe('status');
    expect(resolveDynoQuestionIntent('我的ＦＦＭＩ評分如何？')).toBe('status');
    expect(resolveDynoQuestionIntent('FFMI 評分標準是什麼？')).toBe('methodology');
  });

  it('detects status intent from performance phrasing', () => {
    expect(resolveDynoQuestionIntent('我的握力分數表現如何')).toBe('status');
    expect(resolveDynoQuestionIntent('幫我解讀狀態')).toBe('status');
    expect(resolveDynoQuestionIntent('那我握力成績如何？')).toBe('status');
    expect(resolveDynoQuestionIntent('我的爆發力表現比起一般人算厲害嗎？')).toBe('status');
    expect(resolveDynoQuestionIntent('我的臂圍在一般人裡算粗嗎？')).toBe('status');
  });

  it('detects bodyFat axis from FFMI / body-fat wording', () => {
    expect(detectQuestionFocusAxis('我的 FFMI 9% 體脂算多少分？')).toBe('bodyFat');
  });

  it('isChassisMacroQuestion gates whole-chassis factory only for macro reads', () => {
    expect(isChassisMacroQuestion('我的總分成績如何？')).toBe(true);
    expect(isChassisMacroQuestion('我的握力表現如何？')).toBe(false);
    expect(isChassisMacroQuestion('六軸裡我最該先補哪個短板？')).toBe(false);
  });

  it('v5.3 — en total score and aggregate aliases trigger macro routing', () => {
    expect(isChassisMacroQuestion('How is my total score?')).toBe(true);
    expect(isChassisMacroQuestion('What is my aggregate score?')).toBe(true);
    expect(isChassisMacroQuestion('Give me a full report on my chassis')).toBe(true);
    expect(isChassisMacroQuestion('How is my total performance?')).toBe(true);
    expect(isChassisMacroQuestion('summary score check')).toBe(true);
    expect(isChassisMacroQuestion('How is my average score?')).toBe(true);
    expect(isChassisMacroQuestion("What's my score?")).toBe(true);
    expect(isChassisMacroQuestion('How am I doing overall?')).toBe(true);
  });

  it('locks chassis macro score reads to status before methodology', () => {
    expect(resolveDynoQuestionIntent('How is my total score?')).toBe('status');
    expect(resolveDynoQuestionIntent('How is my average score?')).toBe('status');
    expect(resolveDynoQuestionIntent('How is grip score calculated?')).not.toBe('status');
  });

  it('prefers question-focus closing for status and methodology intents', () => {
    expect(
      shouldPreferQuestionFocusClosing('幫我解讀狀態', { focusAxis: null, mode: 'cross-axis' })
    ).toBe(false);
    expect(
      shouldPreferQuestionFocusClosing('握力怎麼給分', { focusAxis: null, mode: 'cross-axis' })
    ).toBe(true);
    expect(
      shouldPreferQuestionFocusClosing('我的總分成績如何？', { focusAxis: null, mode: 'cross-axis' })
    ).toBe(true);
  });
});
