import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DYNO_INTEL_GEMINI_MODEL } from "../shared/constants.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    commentary: { type: "string" },
    action_directive: { type: "string" },
    is_off_topic: { type: "boolean" },
    detected_weakest_axis: { type: "string" },
  },
  required: ["commentary", "action_directive", "is_off_topic", "detected_weakest_axis"],
};

let cachedSystemPrompt = null;

function loadSystemPrompt(promptTemplateId = "system_v1") {
  if (cachedSystemPrompt && promptTemplateId === "system_v1") {
    return cachedSystemPrompt;
  }
  const filePath = join(__dirname, "prompts", `${promptTemplateId}.txt`);
  let text;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    const err = new Error(`prompt-not-found:${promptTemplateId}`);
    err.code = "failed-precondition";
    throw err;
  }
  if (promptTemplateId === "system_v1") {
    cachedSystemPrompt = text;
  }
  return text;
}

function requireGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("gemini-not-configured");
    err.code = "failed-precondition";
    throw err;
  }
  return apiKey;
}

/**
 * Calls Gemini with structured JSON output.
 * Design intent (WHY): API key stays server-side; client only sends de-identified context.
 */
export async function runGeminiDynoIntel({
  context,
  userQuestion,
  promptTemplateId = "system_v1",
}) {
  const apiKey = requireGeminiApiKey();
  const systemInstruction = loadSystemPrompt(promptTemplateId);
  const model = DYNO_INTEL_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify({
              context,
              userQuestion,
              promptTemplateId,
            }),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    const err = new Error(`gemini-http-${response.status}`);
    err.code = "internal";
    err.detail = detail.slice(0, 500);
    throw err;
  }

  const json = await response.json();
  const text =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    json?.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;

  if (!text) {
    const err = new Error("gemini-empty-response");
    err.code = "internal";
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const err = new Error("gemini-invalid-json");
    err.code = "internal";
    throw err;
  }

  return {
    commentary: String(parsed.commentary ?? ""),
    action_directive: String(parsed.action_directive ?? ""),
    is_off_topic: Boolean(parsed.is_off_topic),
    detected_weakest_axis: String(parsed.detected_weakest_axis ?? ""),
  };
}
