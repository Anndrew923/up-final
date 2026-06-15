#!/usr/bin/env node
/**
 * Golden Prompt audit harness for DYNO INTEL v2.3 + flash-lite.
 * Run: node scripts/golden-dyno-intel-audit.mjs
 * Requires GEMINI_API_KEY in functions/.env.local
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runGeminiDynoIntel, lastGeminiUsageMetadata } from "../functions/dynoIntel/gemini.js";
import { resetGeminiContextCacheForTests } from "../functions/dynoIntel/geminiContextCache.js";
import { buildDynoIntelInferenceContext } from "../functions/dynoIntel/pruneScoringMethodologyBriefs.js";
import { resolveDynoIntelGeminiModel } from "../functions/dynoIntel/resolveGeminiModel.js";
import { resolveDynoQuestionIntent } from "../functions/dynoIntel/resolveQuestionIntent.js";
import { DYNO_INTEL_GEMINI_MODEL_METHODOLOGY } from "../functions/shared/constants.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const envPath = join(rootDir, "functions", ".env.local");
  if (!existsSync(envPath)) return false;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
  return Boolean(process.env.GEMINI_API_KEY);
}

const baseAxes = [
  { axis: "strength", score: 142, tierBandId: "TIER_140", cardCopy: { title: "頂規扭矩", summary: "深蹲臥推硬舉綜合" } },
  { axis: "bodyFat", score: 96, tierBandId: "TIER_95", cardCopy: { title: "頂規排量", summary: "FFMI 96" } },
  { axis: "cardio", score: 88, tierBandId: "TIER_85" },
  { axis: "explosivePower", score: 75, tierBandId: "TIER_70" },
  { axis: "muscleMass", score: 110, tierBandId: "TIER_110" },
  { axis: "gripStrength", score: 65, tierBandId: "TIER_60" },
];

const methodologyBriefs = [
  {
    metric: "strength",
    title: "力量計分",
    body: "本 App 以 Brzycki 與 IPF DOTS 綜合給分。",
  },
];

const gripMethodologyBriefs = [
  {
    metric: "gripStrength",
    title: "評測參考資料",
    body:
      "計算式：score = peakKg × 1.4（女性再乘 1.6）。資料來源背書：IronMind Captains of Crush (CoC) 菁英適格者數據。",
  },
];

const GOLDEN_CASES = [
  { id: "zh-on-topic-1", locale: "zh-Hant", mode: "single-axis", focusAxis: "bodyFat", question: "我的 FFMI 分數代表什麼？", expectOffTopic: false },
  { id: "zh-on-topic-2", locale: "zh-Hant", mode: "single-axis", focusAxis: "strength", question: "力量軸這個分數在競技體育裡算什麼水平？", expectOffTopic: false, replyClosingCue: "通電完成。這份力量遙測已寫入主機。", closingBeatKind: "passion-close", closingBeatSecondLine: "保持這股鋼鐵意志，下一組通電見。" },
  { id: "zh-methodology-1", locale: "zh-Hant", mode: "single-axis", focusAxis: "strength", question: "本 App 力量怎麼計分？", scoringMethodologyBriefs: methodologyBriefs, expectOffTopic: false, closingBeatKind: "methodology-nudge", closingBeatSecondLine: "可到力量評測頁展開完整給分說明。" },
  { id: "zh-methodology-2", locale: "zh-Hant", mode: "cross-axis", focusAxis: null, question: "DOTS 和 Brzycki 在你們 App 裡怎麼影響分數？", scoringMethodologyBriefs: methodologyBriefs, expectOffTopic: false },
  {
    id: "zh-methodology-grip",
    locale: "zh-Hant",
    mode: "single-axis",
    focusAxis: "gripStrength",
    question: "握力分數是如何評斷的？",
    expectedIntent: "methodology",
    scoringMethodologyBriefs: gripMethodologyBriefs,
    closingBeatKind: "methodology-nudge",
    closingBeatSecondLine: "可到握力評測頁展開完整給分說明。",
    expectOffTopic: false,
    expectMethodologyBriefAnchors: [/CoC|Captains|peakKg|計算式|IronMind/i],
    forbidRepeatedScoreAnchor: true,
  },
  {
    id: "zh-status-grip-performance",
    locale: "zh-Hant",
    mode: "single-axis",
    focusAxis: "gripStrength",
    question: "我的握力表現如何？",
    expectedIntent: "status",
    expectOffTopic: false,
    replyClosingCue:
      "握力 / 抓地 停在 98.4 分，級距【競技級熱熔極限胎】——這份遙測主機已鎖定，值得你下次通電再對照。",
    closingBeatKind: "return-ritual",
    closingBeatSecondLine: "遙測已封存。下次通電時，帶著新的分數回來——我會在這裡等你。",
    axes: [
      { axis: "gripStrength", score: 98.4, tierBandId: "TIER_130", cardCopy: { title: "競技級熱熔極限胎", summary: "【賽道配置】突破業餘天花板。輪胎進入工作溫度後表面呈現黏性，在操作絕大多數重載動作時，都能提供強大的極限操控力。" } },
      { axis: "strength", score: 142, tierBandId: "TIER_140", cardCopy: { title: "頂規扭矩", summary: "深蹲臥推硬舉綜合" } },
      { axis: "bodyFat", score: 96, tierBandId: "TIER_95", cardCopy: { title: "頂規排量", summary: "FFMI 96" } },
      { axis: "cardio", score: 88, tierBandId: "TIER_85" },
      { axis: "explosivePower", score: 75, tierBandId: "TIER_70" },
      { axis: "muscleMass", score: 110, tierBandId: "TIER_110" },
    ],
    forbidDuplicateBodyParagraphs: true,
    forbidVehicleLexiconInBeat1: true,
  },
  { id: "zh-gaps-1", locale: "zh-Hant", mode: "single-axis", focusAxis: "gripStrength", gaps: [{ axis: "gripStrength" }], question: "握力軸怎麼解讀？", expectOffTopic: false },
  { id: "zh-gaps-2", locale: "zh-Hant", mode: "cross-axis", focusAxis: null, gaps: [{ axis: "cardio" }], question: "我的心肺遙測正常嗎？", expectOffTopic: false },
  { id: "zh-off-topic-1", locale: "zh-Hant", mode: "cross-axis", focusAxis: null, question: "今晚吃什麼比較健康？", expectOffTopic: true },
  { id: "zh-off-topic-2", locale: "zh-Hant", mode: "single-axis", focusAxis: "strength", question: "膝蓋痛怎麼辦？", expectOffTopic: true },
  { id: "zh-cross-1", locale: "zh-Hant", mode: "cross-axis", focusAxis: null, question: "六軸裡我最該先補哪個短板？", expectOffTopic: false, weakestAxis: "gripStrength" },
  { id: "zh-supplemental-1", locale: "zh-Hant", mode: "single-axis", focusAxis: "cardio", focusSupplemental: "cooper", supplementalMetrics: [{ metric: "cooper", score: 120, tierBandId: "TIER_120", cardCopy: { title: "Cooper 頂規", summary: "12 分鐘跑" } }], question: "我的 Cooper 測驗分數怎麼看？", expectOffTopic: false },
  { id: "en-on-topic-1", locale: "en", mode: "single-axis", focusAxis: "bodyFat", question: "What does my FFMI score mean?", expectOffTopic: false },
  { id: "en-on-topic-2", locale: "en", mode: "single-axis", focusAxis: "strength", question: "How strong is this strength axis score in sport terms?", expectOffTopic: false, replyClosingCue: "Uplink complete. This strength telemetry is logged.", closingBeatKind: "passion-close", closingBeatSecondLine: "Keep that steel discipline — next set, next uplink." },
  { id: "en-methodology-1", locale: "en", mode: "single-axis", focusAxis: "strength", question: "How does this app score strength?", scoringMethodologyBriefs: [{ metric: "strength", title: "Strength scoring", body: "Brzycki and IPF DOTS combined." }], expectOffTopic: false, closingBeatKind: "methodology-nudge", closingBeatSecondLine: "Open the strength assessment page for the full methodology." },
  { id: "en-methodology-2", locale: "en", mode: "cross-axis", focusAxis: null, question: "Explain DOTS and Brzycki in this app's scoring.", scoringMethodologyBriefs: [{ metric: "strength", title: "Strength scoring", body: "Brzycki and IPF DOTS combined." }], expectOffTopic: false },
  { id: "en-gaps-1", locale: "en", mode: "single-axis", focusAxis: "gripStrength", gaps: [{ axis: "gripStrength" }], question: "How should I read grip telemetry?", expectOffTopic: false },
  { id: "en-gaps-2", locale: "en", mode: "cross-axis", focusAxis: null, gaps: [{ axis: "cardio" }], question: "Is my cardio telemetry healthy?", expectOffTopic: false },
  { id: "en-off-topic-1", locale: "en", mode: "cross-axis", focusAxis: null, question: "What should I eat tonight?", expectOffTopic: true },
  { id: "en-off-topic-2", locale: "en", mode: "single-axis", focusAxis: "strength", question: "My knee hurts, what should I do?", expectOffTopic: true },
  { id: "en-cross-1", locale: "en", mode: "cross-axis", focusAxis: null, question: "Which axis should I fix first?", expectOffTopic: false, weakestAxis: "gripStrength" },
  { id: "en-supplemental-1", locale: "en", mode: "single-axis", focusAxis: "cardio", focusSupplemental: "5km", supplementalMetrics: [{ metric: "5km", score: 115, tierBandId: "TIER_110", cardCopy: { title: "5K elite", summary: "5 km run" } }], question: "How do I read my 5 km score?", expectOffTopic: false },
];

function buildContext(testCase) {
  const routingContext = {
    mode: testCase.mode,
    focusAxis: testCase.focusAxis ?? null,
    focusAxisLexicon: testCase.focusAxisLexicon ?? null,
  };
  const intent = resolveDynoQuestionIntent(testCase.question, routingContext);
  const needsBeat3 = !testCase.expectOffTopic && (!testCase.gaps || testCase.gaps.length === 0);
  const isZh = testCase.locale !== "en";

  return {
    schemaVersion: 1,
    locale: testCase.locale,
    mode: testCase.mode,
    focusAxis: testCase.focusAxis ?? null,
    axes: testCase.axes ?? baseAxes,
    momentum: { hasHistory: false, deltas: [], overallDelta: null },
    gaps: testCase.gaps ?? [],
    weakestAxis: testCase.weakestAxis ?? "gripStrength",
    scoringMethodologyBriefs: testCase.scoringMethodologyBriefs ?? [],
    supplementalMetrics: testCase.supplementalMetrics ?? [],
    focusSupplemental: testCase.focusSupplemental ?? null,
    intent,
    replyClosingCue:
      testCase.replyClosingCue ??
      (needsBeat3
        ? isZh
          ? "通電完成。這份遙測已寫入主機。"
          : "Uplink complete. This telemetry is logged on the host."
        : ""),
    closingBeatKind:
      testCase.closingBeatKind ??
      (intent === "methodology" ? "methodology-nudge" : "return-ritual"),
    closingBeatSecondLine:
      testCase.closingBeatSecondLine ??
      (needsBeat3
        ? isZh
          ? "保持節奏，下次通電再對照。"
          : "Keep the cadence — match again on your next uplink."
        : ""),
  };
}

function auditReply(testCase, reply, inferenceContext, routedModel) {
  const issues = [];
  if (Boolean(reply.is_off_topic) !== testCase.expectOffTopic) {
    issues.push(`is_off_topic expected ${testCase.expectOffTopic} got ${reply.is_off_topic}`);
  }
  if (reply.action_directive) {
    issues.push("action_directive must be empty");
  }
  if (testCase.expectedIntent && inferenceContext?.intent !== testCase.expectedIntent) {
    issues.push(`intent expected ${testCase.expectedIntent} got ${inferenceContext?.intent}`);
  }
  if (testCase.expectedIntent === "methodology" && routedModel !== DYNO_INTEL_GEMINI_MODEL_METHODOLOGY) {
    issues.push(`expected routed model ${DYNO_INTEL_GEMINI_MODEL_METHODOLOGY} got ${routedModel}`);
  }
  if (testCase.closingBeatKind === "methodology-nudge" && inferenceContext?.closingBeatKind !== "methodology-nudge") {
    issues.push(`closingBeatKind expected methodology-nudge got ${inferenceContext?.closingBeatKind}`);
  }
  if (!testCase.expectOffTopic && (!testCase.gaps || testCase.gaps.length === 0)) {
    const paragraphs = String(reply.commentary ?? "").split(/\n\n+/).filter(Boolean);
    if (paragraphs.length !== 3) {
      issues.push(`expected 3 paragraphs, got ${paragraphs.length}`);
    }
  }
  if (!testCase.expectOffTopic && testCase.gaps?.length) {
    if (!String(reply.commentary).includes("REMOTE ERROR")) {
      issues.push("gaps reply missing REMOTE ERROR opener");
    }
  }
  const commentary = String(reply.commentary ?? "");
  if (Array.isArray(testCase.expectMethodologyBriefAnchors)) {
    const hasAnchor = testCase.expectMethodologyBriefAnchors.some((pattern) => pattern.test(commentary));
    if (!hasAnchor) {
      issues.push("methodology reply missing expected brief anchors");
    }
  }
  if (testCase.forbidRepeatedScoreAnchor) {
    const scoreAnchors = commentary.match(/停在\s*[\d.]+\s*分/g) ?? [];
    if (scoreAnchors.length >= 2) {
      issues.push(`methodology reply repeats score anchor (${scoreAnchors.length}x)`);
    }
  }
  if (testCase.forbidDuplicateBodyParagraphs) {
    const paragraphs = commentary.split(/\n\n+/).filter(Boolean);
    if (paragraphs.length >= 2 && paragraphs[0].trim() === paragraphs[1].trim()) {
      issues.push("body paragraphs are duplicated");
    }
  }
  if (testCase.forbidVehicleLexiconInBeat1) {
    const paragraphs = commentary.split(/\n\n+/).filter(Boolean);
    if (paragraphs[0] && /輪胎|遙測底盤|馬力頻譜/.test(paragraphs[0])) {
      issues.push("beat-1 contains vehicle lexicon");
    }
  }
  return issues;
}

async function main() {
  if (!loadEnvLocal()) {
    console.error("[golden-audit] GEMINI_API_KEY missing in functions/.env.local — skipping live audit");
    process.exit(0);
  }

  resetGeminiContextCacheForTests();
  const results = [];
  let totalPrompt = 0;
  let totalCached = 0;
  let totalOutput = 0;

  for (const testCase of GOLDEN_CASES) {
    const context = buildContext(testCase);
    const inferenceContext = buildDynoIntelInferenceContext(context, testCase.question);
    const routedModel = resolveDynoIntelGeminiModel(testCase.question);
    const reply = await runGeminiDynoIntel({
      context: inferenceContext,
      userQuestion: testCase.question,
    });
    const issues = auditReply(testCase, reply, inferenceContext, routedModel);
    const usage = lastGeminiUsageMetadata ?? {};
    totalPrompt += usage.promptTokenCount ?? 0;
    totalCached += usage.cachedContentTokenCount ?? 0;
    totalOutput += usage.candidatesTokenCount ?? 0;
    results.push({ id: testCase.id, ok: issues.length === 0, issues, usage, routedModel });
    const status = issues.length === 0 ? "PASS" : "FAIL";
    console.log(`[${status}] ${testCase.id} (model: ${routedModel})`);
    if (issues.length) {
      for (const issue of issues) console.log(`  - ${issue}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log("\n[golden-audit] summary");
  console.log(`  cases: ${results.length}`);
  console.log(`  pass: ${results.length - failed.length}`);
  console.log(`  fail: ${failed.length}`);
  console.log(`  usageMetadata totals — prompt: ${totalPrompt}, cached: ${totalCached}, output: ${totalOutput}`);

  const methodologyRuns = results.filter((r) => !String(r.routedModel).includes("flash-lite")).length;
  const liteRuns = results.length - methodologyRuns;
  console.log(`  routed flash (methodology): ${methodologyRuns}`);
  console.log(`  routed flash-lite: ${liteRuns}`);

  const inputCostUsd =
    results.reduce((sum, row) => {
      const prompt = row.usage?.promptTokenCount ?? 0;
      const cached = row.usage?.cachedContentTokenCount ?? 0;
      const output = row.usage?.candidatesTokenCount ?? 0;
      const isFlash = String(row.routedModel).includes("flash-lite") === false;
      const inputRate = isFlash ? 0.3 : 0.1;
      const cachedRate = isFlash ? 0.03 : 0.01;
      const outputRate = isFlash ? 2.5 : 0.4;
      return sum + ((prompt - cached) * inputRate + cached * cachedRate + output * outputRate) / 1_000_000;
    }, 0);
  console.log(`  estimated API cost (dual-track rates): $${inputCostUsd.toFixed(6)}`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[golden-audit] failed", err);
  process.exit(1);
});
