const SENTENCE_END = /(?<=[。！？!?])\s*/;

/**
 * Inserts paragraph breaks when the model returns a wall of text.
 * WHY: Prompt mandates \\n\\n — sentence splitting is a last-resort fallback only when the
 * backend ships zero paragraph breaks; never re-split an already canonical three-beat body.
 */
export function formatDynoIntelCommentary(text: string): string {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('\n\n')) {
    return trimmed.replace(/\n{3,}/g, '\n\n').trim();
  }

  const sentences = trimmed.split(SENTENCE_END).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 1) return trimmed;

  return sentences.join('\n\n');
}

/** Splits formatted commentary into render-ready paragraphs. */
export function splitDynoIntelCommentaryParagraphs(text: string): string[] {
  const formatted = formatDynoIntelCommentary(text);
  if (!formatted) return [];
  return formatted
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
