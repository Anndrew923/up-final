export function splitCommentaryParagraphs(commentary) {
  return String(commentary ?? "")
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

const MIN_PARAGRAPH_CHARS = 4;

const VEHICLE_BEAT_MARKERS =
  /遙測底盤|熱熔|輪胎|煞車|抓地頻譜|馬力|扭矩|排量|渦輪|底盤中|傳動|彈射|冷卻續航|車架剛性|空力噸位|重載動作/i;

const HUMAN_BEAT_MARKERS =
  /神經肌肉|募集|常模|人體|生理|競技體育|NBA|健力|舉重|制動|骨骼肌|心肺儲能|爆發起跳|握力評分/i;

const AXIS_HUMAN_OPENERS = {
  gripStrength: "握力制動與前臂神經肌肉募集",
  strength: "力量輸出與骨骼肌協同",
  explosivePower: "爆發起跳與神經驅動",
  cardio: "心肺儲能與有氧適應",
  muscleMass: "骨骼肌量與肌纖維密度",
  bodyFat: "體成分與瘦體重常模",
};

const AXIS_HUMAN_CLOSERS = {
  gripStrength:
    "以前臂屈肌群制動與神經驅動募集為解碼主軸，對照同齡同級專項運動員的握力常模評估輸出密度。",
  strength: "以多關節力量輸出與骨骼肌協同為解碼主軸，對照健力與舉重常模評估相對強度。",
  explosivePower: "以爆發起跳與神經驅動鏈為解碼主軸，對照田徑與球類專項的爆發常模。",
  cardio: "以心肺儲能與有氧適應為解碼主軸，對照耐力運動員梯隊評估續航輸出。",
  muscleMass: "以骨骼肌量與肌纖維密度為解碼主軸，對照同體重級運動員的肌量常模。",
  bodyFat: "以體成分與瘦體重常模為解碼主軸，對照同身高級運動員的體態梯度。",
};

const AXIS_VEHICLE_SPECTRUM = {
  gripStrength: "煞車抓地",
  strength: "扭矩／排量",
  explosivePower: "傳動彈射",
  cardio: "冷卻續航",
  muscleMass: "車架剛性",
  bodyFat: "空力噸位",
};

function resolvePrimaryAxisSnap(context) {
  if (!context) return null;
  const focusAxis = context.questionFocusAxis ?? context.focusAxis ?? null;
  const axes = Array.isArray(context.axes) ? context.axes : [];
  return (
    (focusAxis ? axes.find((snap) => snap?.axis === focusAxis) : null) ??
    axes.find((snap) => snap?.score != null && snap?.cardCopy?.title) ??
    null
  );
}

function humanizeCardCopySummary(summary) {
  return String(summary ?? "")
    .replace(/^【[^】]+】[。.]?\s*/, "")
    .replace(/[。.]\s*$/, "")
    .trim();
}

/**
 * v2.3.7 — synthesize beat-1 when the model skips human science entirely.
 * WHY: Never paste tier card summary verbatim — it carries vehicle metaphor that poisons beat-1.
 */
export function synthesizeHumanBeatFromCardCopy(context) {
  const snap = resolvePrimaryAxisSnap(context);
  const title = String(snap?.cardCopy?.title ?? "").trim();
  if (!title) return null;

  const opener = AXIS_HUMAN_OPENERS[snap.axis] ?? "這項運動表現";
  const closer =
    AXIS_HUMAN_CLOSERS[snap.axis] ??
    "以競技體育常模與專項適應為解碼基準，對照同齡運動員梯隊評估輸出密度。";
  return `【${title}】這份級距標題，對應${opener}在競技體育常模中的站位。${closer}`;
}

/**
 * v2.3.8 — synthesize beat-2 when the model skips vehicle mapping or duplicates beat-1.
 */
export function synthesizeVehicleBeatFromContext(context) {
  const snap = resolvePrimaryAxisSnap(context);
  if (!snap?.cardCopy?.title) {
    return "在《最強肉體》主機的遙測底盤中，這份力量天賦被精準類比為馬力頻譜的輸出。";
  }
  const spectrum = AXIS_VEHICLE_SPECTRUM[snap.axis] ?? "馬力";
  const title = String(snap.cardCopy.title).trim();
  const summary = humanizeCardCopySummary(snap.cardCopy?.summary);
  const weave = summary ? `，${summary}` : "";
  return `在《最強肉體》主機的遙測底盤中，這份力量天賦被精準類比為${spectrum}頻譜的輸出，級距【${title}】${weave}。`;
}

function normalizeParagraphKey(text) {
  return String(text ?? "")
    .replace(/\s+/g, "")
    .trim();
}

export function paragraphsAreNearDuplicate(a, b) {
  const left = normalizeParagraphKey(a);
  const right = normalizeParagraphKey(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length > 40 && right.length > 40 && (left.includes(right) || right.includes(left))) {
    return true;
  }
  return false;
}

export function paragraphIsCanonicalVehicleBeat(text) {
  return /^在《最強肉體》主機的遙測底盤中/.test(String(text ?? "").trim());
}

export function dedupeBodyParagraphs(paragraphs) {
  const result = [];
  for (const paragraph of paragraphs) {
    const normalized = String(paragraph ?? "").trim();
    if (!normalized) continue;
    if (result.some((existing) => paragraphsAreNearDuplicate(existing, normalized))) continue;
    result.push(normalized);
  }
  return result;
}

function shouldEnforceHumanVehicleBeats(context) {
  return context?.intent !== "methodology";
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

function isFragmentParagraph(text, minChars = MIN_PARAGRAPH_CHARS) {
  return String(text ?? "").trim().length < minChars;
}

/**
 * v2.3.6 — absorb orphan shards like「本」into neighboring beats before collapse.
 */
export function mergeFragmentParagraphs(paragraphs, minChars = MIN_PARAGRAPH_CHARS) {
  const result = [];
  for (const paragraph of paragraphs) {
    const trimmed = String(paragraph ?? "").trim();
    if (!trimmed) continue;
    if (isFragmentParagraph(trimmed, minChars) && result.length > 0) {
      result[result.length - 1] = `${result[result.length - 1]} ${trimmed}`.trim();
      continue;
    }
    if (result.length === 1 && isFragmentParagraph(result[0], minChars)) {
      result[0] = `${result[0]} ${trimmed}`.trim();
      continue;
    }
    result.push(trimmed);
  }
  if (result.length >= 2 && isFragmentParagraph(result[result.length - 1], minChars)) {
    const tail = result.pop();
    result[result.length - 1] = `${result[result.length - 1]} ${tail}`.trim();
  }
  return result;
}

/** v2.3.6 — merge middle overflow into beat-2 slot instead of preserving a brittle paragraphs[1]. */
export function collapseToThreeParagraphs(paragraphs) {
  if (paragraphs.length <= 3) return [...paragraphs];
  const head = paragraphs[0];
  const middle = paragraphs.slice(1, -1).join(" ");
  const tail = paragraphs[paragraphs.length - 1];
  return [head, middle, tail].map((paragraph) => paragraph.trim()).filter(Boolean);
}

export function paragraphLooksLikeVehicleBeat(text) {
  const normalized = String(text ?? "").trim();
  if (!normalized) return false;
  if (isCanonicalHumanBeatSynthesis(normalized)) return false;
  return (
    /^在《最強肉體》主機的遙測底盤中/.test(normalized) || VEHICLE_BEAT_MARKERS.test(normalized)
  );
}

function isCanonicalHumanBeatSynthesis(text) {
  return /^【[^】]+】這份級距標題/.test(String(text ?? "").trim());
}

export function paragraphLooksLikeHumanBeat(text) {
  const normalized = String(text ?? "").trim();
  if (!normalized) return false;
  if (isCanonicalHumanBeatSynthesis(normalized)) return true;
  return HUMAN_BEAT_MARKERS.test(normalized) && !paragraphLooksLikeVehicleBeat(normalized);
}

function stripFuzzyBeat3Anchors(text, context) {
  let result = String(text ?? "").trim();
  const anchors = extractBeat3FeatureAnchors(context);

  result = result.replace(/這份遙測主機已鎖定[^。！？]*[。！？]?/g, "").trim();
  result = result.replace(/值得你下次通電再對照[。！？]?/g, "").trim();

  if (anchors.score) {
    const escaped = anchors.score.replace(".", "\\.");
    result = result
      .replace(new RegExp(`(?:達到了|停在|有|為)\\s*${escaped}\\s*分[，,、]?`, "g"), "")
      .trim();
    result = result
      .replace(new RegExp(`(?:您的?|你)的?[^。]{0,24}?分數為?\\s*${escaped}\\s*分[，,、]?`, "g"), "")
      .trim();
    result = result.replace(/級距[為為]?\s*【[^】]+】[，,、]?/g, "").trim();
    result = result.replace(/已突破業餘天花板[，,、]?/g, "").trim();
  }

  return result.replace(/^[，,、。\s]+|[，,、。\s]+$/g, "").trim();
}

const OPEN_CLAUSE_TAIL =
  /(?:這意味著你的|這代表著你的|這將使你的|這代表你的|這意味著|這代表著|這將使|這意味|這代表)$/;

/** v2.3.9 — detect model tails cut mid-bridge into beat-3 (e.g.「這意味著你的」). */
export function endsWithOpenClause(text) {
  return OPEN_CLAUSE_TAIL.test(String(text ?? "").trim());
}

/**
 * v2.3.9 — incomplete shard detector; vehicle beats require a terminal sentence.
 */
export function paragraphLooksIncomplete(text, options = {}) {
  const normalized = String(text ?? "").trim();
  if (!normalized) return true;
  if (endsWithOpenClause(normalized)) return true;

  const isVehicle =
    options.vehicleBeat === true ||
    (options.vehicleBeat !== false && paragraphLooksLikeVehicleBeat(normalized));

  if (isVehicle) {
    if (!/[。！？!?]$/.test(normalized)) return true;
    const lastSentence = splitSentences(normalized).pop() ?? normalized;
    if (endsWithOpenClause(lastSentence)) return true;
    return false;
  }

  return normalized.length < 48 && !/[。！？!?]$/.test(normalized);
}

export function vehicleBeatNeedsCanonicalReplace(text, context) {
  if (!shouldEnforceHumanVehicleBeats(context)) return false;
  return paragraphLooksIncomplete(text, { vehicleBeat: true });
}

/** v2.3.9 — replace truncated/stripped vehicle shards with pre-authored beat-2. */
export function ensureCanonicalVehicleBeat(paragraph, context) {
  const normalized = String(paragraph ?? "").trim();
  if (!vehicleBeatNeedsCanonicalReplace(normalized, context)) return normalized;
  return synthesizeVehicleBeatFromContext(context);
}

/** v2.3.9 — lock beat-2 to a complete vehicle paragraph after leak stripping. */
export function repairVehicleBeatIntegrity(paragraphs, context) {
  if (!shouldEnforceHumanVehicleBeats(context) || paragraphs.length < 2) return paragraphs;

  const next = [...paragraphs];
  const vehicleIndex =
    next.length >= 3
      ? 1
      : next.findIndex(
          (paragraph) =>
            paragraphLooksLikeVehicleBeat(paragraph) || paragraphIsCanonicalVehicleBeat(paragraph)
        );

  if (vehicleIndex < 0) return next;
  next[vehicleIndex] = ensureCanonicalVehicleBeat(next[vehicleIndex], context);
  return next;
}

export function paragraphCarriesEarlyScoreLeak(text, context) {
  const normalized = String(text ?? "").trim();
  if (!normalized) return false;
  const anchors = extractBeat3FeatureAnchors(context);
  if (!anchors.score || !textIncludesScoreAnchor(normalized, anchors.score)) return false;
  if (paragraphLooksLikeHumanBeat(normalized)) return false;
  return true;
}

export function paragraphCarriesBeat3Leak(text, context) {
  const normalized = String(text ?? "").trim();
  if (!normalized) return false;
  if (beat3FeatureAnchorsPresent(normalized, context)) return true;
  if (lineAlreadyPresent(normalized, context.replyClosingCue)) return true;
  if (lineAlreadyPresent(normalized, context.closingBeatSecondLine)) return true;
  if (/遙測主機已鎖定|達到了\s*[\d.]+\s*分|停在\s*[\d.]+\s*分/.test(normalized)) return true;
  if (/您的?\s*[^。]{0,24}分數為?\s*[\d.]+\s*分/.test(normalized)) return true;
  if (paragraphCarriesEarlyScoreLeak(normalized, context)) return true;

  const anchors = extractBeat3FeatureAnchors(context);
  if (
    anchors.score &&
    textIncludesScoreAnchor(normalized, anchors.score) &&
    (/級距|【/.test(normalized) ||
      (anchors.tierKeyword && textIncludesTierAnchor(normalized, anchors.tierKeyword)))
  ) {
    return true;
  }
  return false;
}

/**
 * v2.3.6 — beat-3 anchors belong only in the final paragraph; strip early duplicates.
 */
export function stripBeat3LeaksFromBodyParagraphs(paragraphs, context) {
  if (paragraphs.length === 0) return paragraphs;
  const preserveFromIndex = paragraphs.length >= 3 ? paragraphs.length - 1 : paragraphs.length;

  return paragraphs
    .map((paragraph, index) => {
      if (index >= preserveFromIndex) return String(paragraph ?? "").trim();
      const original = String(paragraph ?? "").trim();
      let text = original;
      const isVehicleSlot =
        index === 1 ||
        paragraphLooksLikeVehicleBeat(original) ||
        paragraphIsCanonicalVehicleBeat(original);

      if (paragraphCarriesBeat3Leak(original, context)) {
        if (shouldEnforceHumanVehicleBeats(context) && index < preserveFromIndex && isVehicleSlot) {
          text = synthesizeVehicleBeatFromContext(context);
        } else {
          text = stripFuzzyBeat3Anchors(stripBeat3FromParagraph(original, context), context);
        }
      }

      if (
        shouldEnforceHumanVehicleBeats(context) &&
        index < preserveFromIndex &&
        isVehicleSlot
      ) {
        text = ensureCanonicalVehicleBeat(text, context);
      }
      return text;
    })
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * v2.3.7 — drop orphan score shards and truncated half-sentences from the body.
 */
export function dropOrphanBodyShards(paragraphs, context) {
  if (paragraphs.length === 0) return paragraphs;
  const preserveFromIndex = paragraphs.length >= 3 ? paragraphs.length - 1 : paragraphs.length;

  return paragraphs.filter((paragraph, index) => {
    const normalized = String(paragraph ?? "").trim();
    if (!normalized) return false;
    if (index >= preserveFromIndex) return true;
    if (paragraphLooksLikeHumanBeat(normalized) || paragraphLooksLikeVehicleBeat(normalized)) {
      return true;
    }
    if (paragraphCarriesBeat3Leak(normalized, context)) return false;
    if (paragraphCarriesEarlyScoreLeak(normalized, context)) return false;
    if (
      paragraphLooksIncomplete(normalized) &&
      /分|級距|天花板|業餘/.test(normalized)
    ) {
      return false;
    }
    return true;
  });
}

/** v2.3.6 — when the model swaps beats 1 and 2, restore human-temple before vehicle mapping. */
export function repairBeatOrder(paragraphs) {
  if (paragraphs.length < 2) return [...paragraphs];
  const next = [...paragraphs];
  if (paragraphLooksLikeVehicleBeat(next[0]) && paragraphLooksLikeHumanBeat(next[1])) {
    [next[0], next[1]] = [next[1], next[0]];
  }
  return next;
}

/**
 * v2.3.7 — inject synthesized beat-1 when the model opens with vehicle or score-only shards.
 */
export function repairMissingHumanBeat(paragraphs, context) {
  if (paragraphs.length === 0) return paragraphs;
  if (!shouldEnforceHumanVehicleBeats(context)) {
    return repairBeatOrder(paragraphs);
  }

  const synthesized = synthesizeHumanBeatFromCardCopy(context);
  const hasHuman = paragraphs.some((paragraph) => paragraphLooksLikeHumanBeat(paragraph));

  if (hasHuman) {
    const human =
      paragraphs.find((paragraph) => paragraphLooksLikeHumanBeat(paragraph)) ?? paragraphs[0];
    const last = paragraphs[paragraphs.length - 1];
    const tail =
      last &&
      last !== human &&
      (beat3BlockPresent(last, context) ||
        beat3FeatureAnchorsPresent(last, context) ||
        lineAlreadyPresent(last, context.replyClosingCue))
        ? last
        : null;

    const bodyCandidates = paragraphs.filter(
      (paragraph) =>
        paragraph !== human &&
        paragraph !== tail &&
        !paragraphCarriesBeat3Leak(paragraph, context) &&
        !paragraphsAreNearDuplicate(paragraph, human)
    );

    let vehicle =
      bodyCandidates.find((paragraph) => paragraphIsCanonicalVehicleBeat(paragraph)) ??
      bodyCandidates.find((paragraph) => paragraphLooksLikeVehicleBeat(paragraph)) ??
      bodyCandidates[0] ??
      null;

    if (!vehicle || paragraphsAreNearDuplicate(human, vehicle)) {
      vehicle = synthesizeVehicleBeatFromContext(context);
    } else {
      vehicle = ensureCanonicalVehicleBeat(vehicle, context);
    }

    const rebuilt = [human, vehicle];
    if (tail) rebuilt.push(tail);
    return rebuilt;
  }

  if (!synthesized) return repairBeatOrder(paragraphs);

  let vehicleParagraph =
    paragraphs.find((paragraph) => paragraphIsCanonicalVehicleBeat(paragraph)) ??
    paragraphs.find(
      (paragraph) =>
        paragraphLooksLikeVehicleBeat(paragraph) &&
        !paragraphCarriesBeat3Leak(paragraph, context) &&
        !paragraphsAreNearDuplicate(paragraph, synthesized)
    ) ??
    null;

  if (!vehicleParagraph || paragraphsAreNearDuplicate(synthesized, vehicleParagraph)) {
    vehicleParagraph = synthesizeVehicleBeatFromContext(context);
  } else {
    vehicleParagraph = ensureCanonicalVehicleBeat(vehicleParagraph, context);
  }

  const last = paragraphs[paragraphs.length - 1];
  const tail =
    last &&
    last !== vehicleParagraph &&
    !paragraphsAreNearDuplicate(last, synthesized) &&
    (beat3BlockPresent(last, context) ||
      beat3FeatureAnchorsPresent(last, context) ||
      lineAlreadyPresent(last, context.replyClosingCue))
      ? last
      : null;

  const rebuilt = [synthesized];
  if (vehicleParagraph) rebuilt.push(vehicleParagraph);
  if (tail && rebuilt[rebuilt.length - 1] !== tail) rebuilt.push(tail);
  return rebuilt;
}

function growBodyTowardTwoParagraphs(paragraphs) {
  const body = [...paragraphs];
  while (body.length < 2 && body.length > 0) {
    const split = splitParagraphAtMidSentence(body[0]);
    if (!split) break;
    body.splice(0, 1, split[0], split[1]);
  }
  return body;
}

function forceCanonicalBeat3Tail(paragraphs, context, beat3) {
  if (!beat3 || paragraphs.length === 0) return paragraphs;
  if (paragraphs.length < 3) return paragraphs;

  const head = paragraphs.slice(0, 2);
  const tail = paragraphs[paragraphs.length - 1];
  if (beat3BlockPresent(tail, context)) {
    return [...head, tail];
  }
  return [...head, beat3];
}

function normalizeThreeBeatBody(paragraphs, context, beat3) {
  let body = mergeFragmentParagraphs(paragraphs);
  body = collapseToThreeParagraphs(body);
  body = mergeFragmentParagraphs(body);
  body = stripBeat3LeaksFromBodyParagraphs(body, context);
  body = dropOrphanBodyShards(body, context);
  body = dedupeBodyParagraphs(body);
  body = repairBeatOrder(body);
  body = repairMissingHumanBeat(body, context);
  body = repairVehicleBeatIntegrity(body, context);
  body = dedupeBodyParagraphs(body);
  body = growBodyTowardTwoParagraphs(body);

  if (body.length >= 3) {
    return forceCanonicalBeat3Tail(body, context, beat3);
  }
  if (body.length >= 2) {
    return forceCanonicalBeat3Tail([...body.slice(0, 2), beat3], context, beat3);
  }
  if (body.length === 1) {
    const human = synthesizeHumanBeatFromCardCopy(context) ?? body[0];
    const vehicle = synthesizeVehicleBeatFromContext(context);
    return forceCanonicalBeat3Tail([human, vehicle, beat3], context, beat3);
  }
  return [beat3];
}

/**
 * WHY: Models often emit beat-1-only methodology walls; beat contract must deterministically restore 3 beats.
 */
function ensureThreeBeatParagraphs(commentary, context) {
  const beat3 = buildBeat3Paragraph(context);
  if (!beat3) return commentary;

  const paragraphs = splitCommentaryParagraphs(commentary);
  if (paragraphs.length >= 3) {
    const repaired = normalizeThreeBeatBody(paragraphs, context, beat3);
    return repaired.join("\n\n");
  }

  const body = [];

  for (const paragraph of paragraphs) {
    if (
      lineAlreadyPresent(paragraph, context.closingBeatSecondLine) ||
      lineAlreadyPresent(paragraph, context.replyClosingCue) ||
      beat3FeatureAnchorsPresent(paragraph, context) ||
      paragraphCarriesBeat3Leak(paragraph, context)
    ) {
      const stripped = stripFuzzyBeat3Anchors(stripBeat3FromParagraph(paragraph, context), context);
      if (stripped) body.push(stripped);
    } else {
      body.push(paragraph);
    }
  }

  if (body.length === 0) return commentary;

  return normalizeThreeBeatBody(body, context, beat3).join("\n\n");
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

  const second = String(context.closingBeatSecondLine ?? "").trim();
  const cue = String(context.replyClosingCue ?? "").trim();
  const searchSpace = beat3Paragraph || commentary;

  if (second && !lineAlreadyPresent(searchSpace, second)) return false;
  if (cue && !lineAlreadyPresent(searchSpace, cue)) return false;
  return Boolean(cue || second);
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
    paragraphs = mergeFragmentParagraphs(paragraphs);
    if (paragraphs.length > 3) {
      paragraphs = collapseToThreeParagraphs(paragraphs);
    }
    paragraphs = mergeFragmentParagraphs(paragraphs);
    commentary = ensureThreeBeatParagraphs(paragraphs.join("\n\n"), context);
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
