import { describe, expect, it } from 'vitest';
import {
  formatDynoIntelCommentary,
  splitDynoIntelCommentaryParagraphs,
} from '../dynoIntelCommentaryFormat';

describe('formatDynoIntelCommentary', () => {
  it('preserves existing double newlines for GAPS replies', () => {
    expect(formatDynoIntelCommentary('第一段。\n\n第二段。')).toBe('第一段。\n\n第二段。');
  });

  it('keeps single-beat multi-sentence commentary as one block', () => {
    const singleBeat =
      '以同齡一般人來看，你的絕對力量表現已站上高階玩家頂尖水準。硬拉時把腳跟踩實，核心就能守住大重量。';
    expect(formatDynoIntelCommentary(singleBeat)).toBe(singleBeat);
  });

  it('normalizes triple-or-more newlines', () => {
    expect(formatDynoIntelCommentary('A。\n\n\nB。')).toBe('A。\n\nB。');
  });

  it('returns single sentence unchanged', () => {
    expect(formatDynoIntelCommentary('只有一句。')).toBe('只有一句。');
  });
});

describe('splitDynoIntelCommentaryParagraphs', () => {
  it('splits formatted commentary on paragraph breaks only', () => {
    expect(splitDynoIntelCommentaryParagraphs('A。\n\nB。')).toEqual(['A。', 'B。']);
  });

  it('does not sentence-split a single-beat wall of text', () => {
    expect(splitDynoIntelCommentaryParagraphs('A。B。C。')).toEqual(['A。B。C。']);
  });

  it('preserves multi-sentence third beat inside one paragraph when breaks exist', () => {
    expect(
      splitDynoIntelCommentaryParagraphs('A。\n\nB。\n\nC第一句。C第二句。')
    ).toEqual(['A。', 'B。', 'C第一句。C第二句。']);
  });
});
