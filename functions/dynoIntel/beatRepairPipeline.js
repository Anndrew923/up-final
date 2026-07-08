/**
 * v3.0 — Dyno Intel beat contract orchestration (single-beat + gaps/methodology routes).
 */
import {
  containsVehicleLexicon,
  joinBriefSegments,
  scrubVehicleLexicon,
} from "./dynoIntelHumanBriefs.js";
import {
  ensureBeatTerminalPunctuation,
  extensionSentenceParaphrasesAnchor,
  finalizeContractCommentary,
  lineAlreadyPresent,
  paragraphsAreNearDuplicate,
  splitCommentaryParagraphs,
  splitCommentarySentences,
  stripEngineeringLeakageFromCommentary,
} from "./beatContractShared.js";
import { isHallOfFameConsultHardReply } from "./hallOfFameConsultGate.js";
import {
  assembleSingleBeatCommentary,
  resolveChassisBriefAssembly,
  isMethodologyReplyContext,
  resolveSingleBeatLocale,
} from "./dynoIntelChassisFactory.js";
import {
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH,
  DYNO_INTEL_PR_PERCENTILE_FALLBACK_ZH,
} from "./dynoIntelHumanPraise.data.js";
import {
  pruneSynonymLoopsInParagraph,
  repairMethodologyCommentary,
} from "./methodologyBeatRepair.js";

export { isMethodologyReplyContext, shouldUseChassisSynthesisPipeline } from "./dynoIntelChassisFactory.js";

function collapseToSingleParagraph(text) {
  return String(text ?? "")
    .split(/\n\n+/)
    .map((row) => row.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripScorePatterns(text) {
  return String(text ?? "")
    .replace(/\d+(?:\.\d+)?\s*分/g, "")
    .replace(/【[^】]+】/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Extension bigram overlap with anchor — catches paraphrase loops without dropping orthogonal axes. */
const EXTENSION_ANCHOR_COVERAGE_REJECT = 0.2;

const OFFICIAL_HARD_SEGMENT_MARKERS = [
  /熱烈搜集中|嚴謹搜集中|全人類官方\s*PR/i,
  /生涯巔峰狀態|僅供天梯對帳與娛樂參考/,
];

function containsOfficialHardSegmentMarker(text) {
  return OFFICIAL_HARD_SEGMENT_MARKERS.some((pattern) => pattern.test(String(text ?? "")));
}

/** WHY: Stale single-paragraph cache may echo PR/legal — strip before AI extension extraction. */
function stripOfficialHardSegmentsFromCoachTail(text, locale) {
  if (locale === "en") {
    return String(text ?? "").trim();
  }
  let row = String(text ?? "").trim();
  const legal = String(DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH ?? "").trim();
  if (legal && row.includes(legal)) {
    row = row.replace(legal, "").trim();
  }
  const pr = String(DYNO_INTEL_PR_PERCENTILE_FALLBACK_ZH ?? "").trim();
  if (pr && row.includes(pr)) {
    row = row.replace(pr, "").trim();
  } else if (pr) {
    for (const chunk of pr.split(/\n\n+/)) {
      if (chunk && row.includes(chunk)) {
        row = row.replace(chunk, "").trim();
      }
    }
  }
  return row;
}

const GENERIC_RITUAL_CLOSER_REGEX =
  /下次請挑戰|讓你的整體表現|下次通電|更值得你反覆|保持這股|主機記得|我會在這裡等你|bring.*new score|next uplink|overall performance/i;

function extensionSentenceIsSafe(sentence, context, anchor, keptSentences) {
  const row = String(sentence ?? "").trim();
  if (!row) return false;
  if (paragraphsAreNearDuplicate(row, anchor)) return false;
  if (containsOfficialHardSegmentMarker(row)) return false;
  if (extensionSentenceParaphrasesAnchor(row, anchor, EXTENSION_ANCHOR_COVERAGE_REJECT)) return false;
  if (Array.isArray(keptSentences) && keptSentences.some((prev) => paragraphsAreNearDuplicate(prev, row))) {
    return false;
  }
  if (GENERIC_RITUAL_CLOSER_REGEX.test(row)) return false;
  if (containsVehicleLexicon(row)) return false;
  if (/\d+(?:\.\d+)?\s*分/.test(row)) return false;
  const closingCue = String(context.replyClosingCue ?? "").trim();
  if (closingCue && lineAlreadyPresent(row, closingCue)) return false;
  const secondLine = String(context.closingBeatSecondLine ?? "").trim();
  if (secondLine && lineAlreadyPresent(row, secondLine)) return false;
  if (/遙測主機已鎖定|REMOTE ERROR|⚠️/.test(row)) return false;
  return true;
}

function extractCoachExtension(aiCommentary, anchor, context) {
  const locale = resolveSingleBeatLocale(context);
  const anchorNorm = String(anchor ?? "").trim();
  // WHY: Golden three-segment — only paragraph 1 is AI territory; ignore PR/legal hard segments.
  const firstParagraph = splitCommentaryParagraphs(aiCommentary)[0];
  let text = firstParagraph ? collapseToSingleParagraph(firstParagraph) : collapseToSingleParagraph(aiCommentary);
  if (!text) return null;

  if (anchorNorm && text.includes(anchorNorm)) {
    text = text.replace(anchorNorm, "").trim();
  }
  text = stripOfficialHardSegmentsFromCoachTail(text, locale);
  if (!text) return null;

  const sentences = splitCommentarySentences(text);
  const kept = [];

  for (const sentence of sentences) {
    let row = stripScorePatterns(scrubVehicleLexicon(sentence));
    if (!row) continue;
    if (!extensionSentenceIsSafe(row, context, anchorNorm, kept)) continue;
    kept.push(row);
    if (kept.length >= 2) break;
  }

  if (!kept.length) return null;
  return kept.join(locale === "en" ? " " : "");
}

function resolveGapsAxisLabel(context, locale) {
  const axis = context?.gaps?.[0]?.axis ?? "unknown";
  const labelsZh = {
    gripStrength: "握力",
    strength: "力量",
    cardio: "心肺",
    bodyFat: "FFMI",
    muscleMass: "肌肉量",
    explosivePower: "爆發",
  };
  const labelsEn = {
    gripStrength: "grip",
    strength: "strength",
    cardio: "cardio",
    bodyFat: "FFMI",
    muscleMass: "muscle mass",
    explosivePower: "explosive power",
  };
  const map = locale === "en" ? labelsEn : labelsZh;
  return map[axis] ?? axis;
}

function synthesizeGapsOpener(context, locale) {
  const axis = context?.gaps?.[0]?.axis ?? "unknown";
  if (locale === "en") {
    return `⚠️ [REMOTE ERROR]: telemetry lost for [${axis}] axis — radar balance at risk.`;
  }
  return `⚠️ [REMOTE ERROR]：行車電腦丟失 [${axis}] 軸線的遙測數據，雷達圖底盤陷入失衡風險。`;
}

function synthesizeGapsNudge(context, locale) {
  const label = resolveGapsAxisLabel(context, locale);
  const nudge = String(context?.assessmentDeepDiveNudge ?? "").trim();
  if (nudge) return nudge;
  if (locale === "en") {
    return `Complete the ${label} assessment first — the assessment page expands scoring detail.`;
  }
  return `請先完成${label}評測——評測頁可展開完整計分說明。`;
}

function enforceGapsCommentary(reply, context) {
  const locale = resolveSingleBeatLocale(context);
  const opener = synthesizeGapsOpener(context, locale);
  const nudge = synthesizeGapsNudge(context, locale);

  let commentary = String(reply.commentary ?? "").trim();
  let paragraphs = splitCommentaryParagraphs(commentary).filter(
    (row) => row && !lineAlreadyPresent(row, context.replyClosingCue)
  );

  if (!paragraphs.some((row) => row.includes("REMOTE ERROR"))) {
    paragraphs.unshift(opener);
  } else {
    paragraphs[0] = opener;
  }

  const tail = paragraphs.length >= 2 ? paragraphs.slice(1).join(" ") : paragraphs[0] === opener ? "" : paragraphs.join(" ");
  let second = tail && !lineAlreadyPresent(tail, opener) ? tail : "";
  if (!second || second.includes("REMOTE ERROR")) {
    second = nudge;
  }
  const secondLine = String(context.closingBeatSecondLine ?? "").trim();
  if (secondLine && !second.includes(secondLine)) {
    second = `${second} ${secondLine}`.trim();
  }

  commentary = [opener, second].filter(Boolean).join("\n\n");
  return {
    ...reply,
    commentary: finalizeContractCommentary(commentary, context, { contractMode: "gaps" }),
  };
}

function enforceSingleBeatCommentary(reply, context) {
  const locale = resolveSingleBeatLocale(context);
  const assembly = resolveChassisBriefAssembly(context);
  const segment1Core = assembly?.segment1Core ?? null;
  const trailingSegments = assembly?.trailingSegments ?? [];

  if (!segment1Core) {
    const collapsed = collapseToSingleParagraph(reply.commentary);
    return {
      ...reply,
      commentary: finalizeContractCommentary(
        ensureBeatTerminalPunctuation(
          pruneSynonymLoopsInParagraph(scrubVehicleLexicon(stripScorePatterns(collapsed))),
          locale
        ),
        context,
        { contractMode: "single" }
      ),
    };
  }

  const extension = extractCoachExtension(reply.commentary, segment1Core, context);
  let cleanedExtension = extension
    ? stripScorePatterns(scrubVehicleLexicon(extension))
    : null;
  if (cleanedExtension) {
    cleanedExtension = pruneSynonymLoopsInParagraph(cleanedExtension);
  }
  const mergedSegment1 = assembleSingleBeatCommentary(segment1Core, cleanedExtension, locale);
  let safeSegment1 = scrubVehicleLexicon(mergedSegment1);
  // WHY: merged always contains segment1Core as prefix — only drop when the extension itself paraphrases core.
  if (cleanedExtension && paragraphsAreNearDuplicate(cleanedExtension, segment1Core)) {
    safeSegment1 = segment1Core;
  }

  const finalizedSegment1 = finalizeContractCommentary(
    ensureBeatTerminalPunctuation(safeSegment1, locale),
    context,
    { contractMode: "single" }
  );
  const commentary = stripEngineeringLeakageFromCommentary(
    joinBriefSegments([finalizedSegment1, ...trailingSegments], locale),
    locale
  );

  return {
    ...reply,
    commentary,
  };
}

/**
 * v3.0 deterministic commentary contract — single beat (status), 2-beat gaps, 1-beat methodology.
 */
export function enforceCommentaryBeatContract(reply, context) {
  if (!reply || reply.is_off_topic || !context) return reply;
  if (isHallOfFameConsultHardReply(reply)) return reply;

  let commentary = String(reply.commentary ?? "").trim();
  if (!commentary) return reply;

  const hasGaps = Array.isArray(context.gaps) && context.gaps.length > 0;

  if (hasGaps) {
    return enforceGapsCommentary(reply, context);
  }

  if (isMethodologyReplyContext(context)) {
    return repairMethodologyCommentary(reply, context);
  }

  return enforceSingleBeatCommentary(reply, context);
}
