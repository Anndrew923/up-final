export function splitCommentaryParagraphs(commentary) {
  return String(commentary ?? "")
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function buildBeat3Paragraph(context) {
  const cue = String(context.replyClosingCue ?? "").trim();
  const second = String(context.closingBeatSecondLine ?? "").trim();
  if (!cue && !second) return "";
  if (cue && second) return `${cue} ${second}`;
  return cue || second;
}

/** WHY: Fuzzy match — model paraphrases but must preserve the pre-resolved anchor phrase. */
export function lineAlreadyPresent(commentary, line) {
  const normalized = String(line ?? "").trim();
  if (!normalized) return true;
  if (commentary.includes(normalized)) return true;

  const probeLength = Math.min(24, normalized.length);
  if (probeLength < 8) return false;
  return commentary.includes(normalized.slice(0, probeLength));
}

function beat3BlockPresent(commentary, context) {
  const second = String(context.closingBeatSecondLine ?? "").trim();
  const cue = String(context.replyClosingCue ?? "").trim();
  if (!lineAlreadyPresent(commentary, second)) return false;
  if (cue && !lineAlreadyPresent(commentary, cue)) return false;
  return true;
}

/**
 * Deterministic beat-3 repair — client pre-resolves copy; model must not drop methodology nudge.
 * WHY: Gemini often stops after methodology beats 1–2; append pre-authored cue + second line.
 */
export function enforceCommentaryBeatContract(reply, context) {
  if (!reply || reply.is_off_topic || !context) return reply;

  const beat3 = buildBeat3Paragraph(context);
  if (!beat3) return reply;

  let commentary = String(reply.commentary ?? "").trim();
  if (!commentary) return reply;

  const hasGaps = Array.isArray(context.gaps) && context.gaps.length > 0;
  const paragraphs = splitCommentaryParagraphs(commentary);
  const second = String(context.closingBeatSecondLine ?? "").trim();

  if (!hasGaps) {
    const contentPresent = beat3BlockPresent(commentary, context);
    const structureCollapsed = paragraphs.length < 3;
    if (structureCollapsed || !contentPresent) {
      commentary = `${commentary}\n\n${beat3}`;
    }
  } else if (second && !lineAlreadyPresent(commentary, second)) {
    if (paragraphs.length >= 1) {
      const merged = [...paragraphs];
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${second}`;
      commentary = merged.join("\n\n");
    } else {
      commentary = `${commentary}\n\n${second}`;
    }
  }

  return { ...reply, commentary: commentary.trim() };
}
