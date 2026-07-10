import { injectChassisBeatsIntoContext } from "./dynoIntelChassisFactory.js";

/**
 * WHY: Gemini system prompt only reads chassisBeats.p1Official — PR, legal, and fullBrief
 * are backend-welded after inference. Shipping them inflates input tokens with zero model utility.
 */
export function buildGeminiInferencePayload(context) {
  const enriched = injectChassisBeatsIntoContext(context);
  if (!enriched?.chassisBeats || typeof enriched.chassisBeats !== "object") {
    return enriched;
  }

  const p1Official = enriched.chassisBeats.p1Official ?? null;
  if (!p1Official) {
    const { chassisBeats: _removed, ...rest } = enriched;
    return rest;
  }

  return {
    ...enriched,
    chassisBeats: {
      p1Official,
    },
  };
}
