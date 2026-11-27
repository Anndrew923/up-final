/**
 * Shared overflow-rail chrome.
 * WHY: Athletes peek rail + phone system carousel both need touch pan without
 * native scrollbar chrome; one token prevents drift.
 */
export const HIDE_SCROLLBAR =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
