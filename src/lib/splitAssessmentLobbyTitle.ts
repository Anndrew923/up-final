export interface SplitAssessmentLobbyTitle {
  main: string;
  sub?: string;
}

/**
 * Split lobby card title into main + subtitle (WHY): Compact grid cards need two typography
 * tiers without duplicating i18n keys; titles use a single localized string with parens.
 * Supports zh-Hant fullwidth （） and en ASCII () so both locales get the same layout.
 */
export function splitAssessmentLobbyTitle(title: string): SplitAssessmentLobbyTitle {
  const match = title.match(/^(.+?)[（(](.+)[）)]$/);
  if (!match) return { main: title };
  return { main: match[1].trim(), sub: match[2].trim() };
}
