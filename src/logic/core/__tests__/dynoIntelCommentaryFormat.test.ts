import { describe, expect, it } from 'vitest';
import {
  formatDynoIntelCommentary,
  splitDynoIntelCommentaryParagraphs,
} from '../dynoIntelCommentaryFormat';

describe('formatDynoIntelCommentary', () => {
  it('preserves existing double newlines', () => {
    expect(formatDynoIntelCommentary('第一段。\n\n第二段。')).toBe('第一段。\n\n第二段。');
  });

  it('does not sentence-split when backend already uses standard paragraph breaks', () => {
    expect(formatDynoIntelCommentary('第一段。\n\n第二段。\n\n第三句一。第三句二。')).toBe(
      '第一段。\n\n第二段。\n\n第三句一。第三句二。'
    );
  });

  it('inserts paragraph breaks after Chinese sentence endings', () => {
    expect(formatDynoIntelCommentary('第一句。第二句！第三句。')).toBe(
      '第一句。\n\n第二句！\n\n第三句。'
    );
  });

  it('returns single sentence unchanged', () => {
    expect(formatDynoIntelCommentary('只有一句。')).toBe('只有一句。');
  });
});

describe('splitDynoIntelCommentaryParagraphs', () => {
  it('splits formatted commentary into paragraphs', () => {
    expect(splitDynoIntelCommentaryParagraphs('A。\n\nB。')).toEqual(['A。', 'B。']);
  });

  it('auto-formats wall of text before splitting', () => {
    expect(splitDynoIntelCommentaryParagraphs('A。B。')).toEqual(['A。', 'B。']);
  });

  it('does not sentence-split a multi-sentence third beat when paragraph breaks exist', () => {
    expect(
      splitDynoIntelCommentaryParagraphs('A。\n\nB。\n\nC第一句。C第二句。')
    ).toEqual(['A。', 'B。', 'C第一句。C第二句。']);
  });
});
