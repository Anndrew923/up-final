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

function splitSentences(text) {
  return (
    String(text ?? "")
      .match(/[^。！？.!?]+[。！？.!?]?/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? [String(text ?? "").trim()].filter(Boolean)
  );
}

function splitParagraphAtMidSentence(paragraph) {
  const sentences = splitSentences(paragraph);
  if (sentences.length < 2) return null;
  const mid = Math.ceil(sentences.length / 2);
  return [sentences.slice(0, mid).join(""), sentences.slice(mid).join("")];
}

function stripBeat3FromParagraph(paragraph, context) {
  let text = String(paragraph ?? "").trim();
  const cue = String(context.replyClosingCue ?? "").trim();
  const second = String(context.closingBeatSecondLine ?? "").trim();
  const beat3 = buildBeat3Paragraph(context);

  for (const fragment of [beat3, second, cue]) {
    if (fragment && text.includes(fragment)) {
      text = text.replace(fragment, "").trim();
    }
  }
  return text;
}

function formatScoreAnchor(score) {
  if (score == null || Number.isNaN(Number(score))) return null;
  const numeric = Number(score);
  return Number.isInteger(numeric) ? String(numeric) : String(numeric);
}

function extractTierKeywordFromTitle(title) {
  const normalized = String(title ?? "").trim();
  if (!normalized) return null;
  const hpMatch = normalized.match(/\d+\s*hp/i);
  if (hpMatch) return hpMatch[0].replace(/\s+/g, "").toLowerCase();
  return normalized.length >= 4 ? normalized.slice(0, Math.min(12, normalized.length)) : normalized;
}

/**
 * v2.3.4 feature anchors — score + tier vehicle tag from pre-resolved context.
 * WHY: Models paraphrase replyClosingCue; literal probe misses but data anchors stay stable.
 */
export function extractBeat3FeatureAnchors(context) {
  const anchors = { score: null, tierKeyword: null };
  if (!context) return anchors;

  const cue = String(context.replyClosingCue ?? "");
  const cueScoreMatch = cue.match(/(\d+(?:\.\d+)?)\s*分/);
  if (cueScoreMatch) {
    anchors.score = cueScoreMatch[1];
  }

  const tierBracket = cue.match(/【([^】]+)】/);
  if (tierBracket?.[1]) {
    anchors.tierKeyword = extractTierKeywordFromTitle(tierBracket[1]);
  }

  const focusAxis = context.questionFocusAxis ?? context.focusAxis ?? null;
  const axes = Array.isArray(context.axes) ? context.axes : [];
  let primarySnap =
    (focusAxis ? axes.find((snap) => snap?.axis === focusAxis) : null) ??
    axes.find((snap) => snap?.score != null && snap?.cardCopy?.title) ??
    null;

  if (!anchors.score && primarySnap?.score != null) {
    anchors.score = formatScoreAnchor(primarySnap.score);
  }

  if (!anchors.tierKeyword && primarySnap?.cardCopy?.title) {
    anchors.tierKeyword = extractTierKeywordFromTitle(primarySnap.cardCopy.title);
  }

  return anchors;
}

function textIncludesScoreAnchor(text, scoreAnchor) {
  if (!scoreAnchor) return false;
  const haystack = String(text ?? "");
  if (haystack.includes(scoreAnchor)) return true;
  const numeric = Number(scoreAnchor);
  if (Number.isNaN(numeric)) return false;
  const integer = Number.isInteger(numeric) ? String(numeric) : null;
  const oneDecimal = numeric.toFixed(1);
  return (
    (integer != null && haystack.includes(integer)) ||
    haystack.includes(oneDecimal) ||
    haystack.includes(String(numeric))
  );
}

function textIncludesTierAnchor(text, tierKeyword) {
  const keyword = String(tierKeyword ?? "").trim();
  if (!keyword) return false;
  const haystack = String(text ?? "").toLowerCase();
  const needle = keyword.toLowerCase();
  if (haystack.includes(needle)) return true;
  const compactNeedle = needle.replace(/\s+/g, "");
  if (compactNeedle.length >= 3 && haystack.replace(/\s+/g, "").includes(compactNeedle)) {
    return true;
  }
  const probeLength = Math.min(8, needle.length);
  return probeLength >= 3 && haystack.includes(needle.slice(0, probeLength));
}

/** v2.3.4 dual feature assertion — both score and tier hit ⇒ beat-3 content is present. */
export function beat3FeatureAnchorsPresent(text, context) {
  const anchors = extractBeat3FeatureAnchors(context);
  if (!anchors.score || !anchors.tierKeyword) return false;
  return (
    textIncludesScoreAnchor(text, anchors.score) &&
    textIncludesTierAnchor(text, anchors.tierKeyword)
  );
}

/**
 * WHY: Models often emit beat-1-only methodology walls; beat contract must deterministically restore 3 beats.
 */
function ensureThreeBeatParagraphs(commentary, context) {
  const beat3 = buildBeat3Paragraph(context);
  if (!beat3) return commentary;

  let paragraphs = splitCommentaryParagraphs(commentary);
  if (paragraphs.length >= 3) return commentary;

  const body = [];

  for (const paragraph of paragraphs) {
    if (
      lineAlreadyPresent(paragraph, context.closingBeatSecondLine) ||
      lineAlreadyPresent(paragraph, context.replyClosingCue) ||
      beat3FeatureAnchorsPresent(paragraph, context)
    ) {
      const stripped = stripBeat3FromParagraph(paragraph, context);
      if (stripped) body.push(stripped);
    } else {
      body.push(paragraph);
    }
  }

  if (body.length === 0) return commentary;

  while (body.length < 2) {
    const split = splitParagraphAtMidSentence(body[0]);
    if (!split) break;
    body.splice(0, 1, split[0], split[1]);
  }

  if (body.length >= 2) {
    return [...body.slice(0, 2), beat3].join("\n\n");
  }

  return commentary;
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
  const paragraphs = splitCommentaryParagraphs(commentary);
  const beat3Paragraph = paragraphs.length >= 3 ? paragraphs[paragraphs.length - 1] : commentary;

  if (beat3FeatureAnchorsPresent(beat3Paragraph, context)) {
    return true;
  }

  const second = String(context.closingBeatSecondLine ?? "").trim();
  const cue = String(context.replyClosingCue ?? "").trim();
  const searchSpace = beat3Paragraph || commentary;

  if (!lineAlreadyPresent(searchSpace, second)) return false;
  if (cue && !lineAlreadyPresent(searchSpace, cue)) return false;
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
  let paragraphs = splitCommentaryParagraphs(commentary);
  const second = String(context.closingBeatSecondLine ?? "").trim();

  if (!hasGaps) {
    if (paragraphs.length > 3) {
      const tail = paragraphs.slice(2).join(" ");
      paragraphs = [paragraphs[0], paragraphs[1], tail];
      commentary = paragraphs.join("\n\n");
    }

    const contentPresent = beat3BlockPresent(commentary, context);
    const structureCollapsed = paragraphs.length < 3;

    if (structureCollapsed || !contentPresent) {
      if (paragraphs.length === 3 && !contentPresent) {
        // v2.3.4: rigid replace — never append canonical beat-3 onto a paraphrased third paragraph.
        paragraphs[2] = beat3;
        commentary = paragraphs.join("\n\n");
      } else {
        commentary = `${commentary}\n\n${beat3}`;
      }
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

  if (!hasGaps) {
    commentary = ensureThreeBeatParagraphs(commentary, context);
  }

  return { ...reply, commentary: commentary.trim() };
}
