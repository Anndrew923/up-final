/**
 * Deterministic methodology reply templates — zero Gemini tokens for fixed scoring logic.
 */
import { resolveMethodologyFullBrief } from "./methodologyBeatRepair.js";
import { resolveDynoQuestionIntent } from "./resolveQuestionIntent.js";

export const OVERALL_METHODOLOGY_TEMPLATE_ZH =
  "本 App 六軸分數各自依獨立常模與計分公式換算（力量含 DOTS／Brzycki 正規化、握力對照 Ironmind／Captains of Crush 級距、心肺含 Cooper 與 5km 常模、體成分以 FFMI 等指標解碼）。若要單一軸的完整給分標準，請直接問例如「力量怎麼算」或「握力給分標準」。";

export const OVERALL_METHODOLOGY_TEMPLATE_EN =
  "Each of this app's six axes is scored from its own norms and formulas (strength uses DOTS/Brzycki normalization, grip maps Ironmind/Captains of Crush bands, cardio uses Cooper and 5 km norms, body composition decodes via FFMI and related metrics). For a full scoring standard on one axis, ask specifically — e.g. \"How is strength calculated?\" or \"What is the grip scoring standard?\"";

/**
 * WHY: Intercept exact methodology queries with deterministic static templates to bypass
 * Gemini Flash calls, achieving zero-token response for fixed scoring logic.
 */
export function shouldPreemptMethodology(userQuestion, context = null) {
  return resolveDynoQuestionIntent(userQuestion, context) === "methodology";
}

export function buildMethodologyTemplateReply(context = null) {
  const locale = context?.locale === "en" ? "en" : "zh-Hant";
  const axisBrief = resolveMethodologyFullBrief(context);
  const commentary =
    axisBrief ||
    (locale === "en" ? OVERALL_METHODOLOGY_TEMPLATE_EN : OVERALL_METHODOLOGY_TEMPLATE_ZH);

  return {
    commentary,
    action_directive: "",
    is_off_topic: false,
    detected_weakest_axis: String(
      context?.questionFocusAxis ?? context?.weakestAxis ?? context?.focusAxis ?? ""
    ),
  };
}
