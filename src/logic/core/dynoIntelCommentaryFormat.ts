/**
 * v3.0 — Preserve backend paragraph breaks only (`\n\n` for GAPS).
 * WHY: Single-beat commentary is one flowing block; sentence splitting made anchor+extension
 * look like redundant multi-paragraph walls.
 */
export function formatDynoIntelCommentary(text: string): string {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/\n{3,}/g, '\n\n').trim();
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
