/**
 * Normalize user questions before intent / axis routing.
 * WHY: Full-width Latin (e.g. ＦＦＭＩ) must match the same regex gates as half-width FFMI.
 */
export function normalizeDynoIntelQuestion(raw) {
  return String(raw ?? "")
    .normalize("NFKC")
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
