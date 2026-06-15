import {
  DYNO_INTEL_GEMINI_MODEL_LITE,
  DYNO_INTEL_GEMINI_MODEL_METHODOLOGY,
} from "../shared/constants.js";
import { resolveDynoQuestionIntent } from "./resolveQuestionIntent.js";

/**
 * Dual-track model routing — methodology uses flash for constitution fidelity; rest uses lite.
 * WHY: Server resolves intent from userQuestion so routing cannot be spoofed via context.
 */
export function resolveDynoIntelGeminiModel(userQuestion) {
  const intent = resolveDynoQuestionIntent(userQuestion);
  if (intent === "methodology") {
    return DYNO_INTEL_GEMINI_MODEL_METHODOLOGY;
  }
  return DYNO_INTEL_GEMINI_MODEL_LITE;
}

export function resolveDynoIntelRoutingIntent(userQuestion, contextIntent) {
  const resolved = resolveDynoQuestionIntent(userQuestion);
  if (
    contextIntent &&
    contextIntent !== resolved &&
    contextIntent !== "general"
  ) {
    console.warn(
      "[dynoIntel] context.intent mismatch — using server-resolved intent",
      { contextIntent, resolved }
    );
  }
  return resolved;
}
