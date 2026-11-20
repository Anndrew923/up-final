import { describe, expect, it } from 'vitest';
import {
  HISTORY_COLLAPSIBLE_CHROME,
  HISTORY_SECTION_DEFAULT_EXPANDED,
} from '../historyCollapsibleChrome';

describe('HISTORY_COLLAPSIBLE_CHROME', () => {
  it('defaults every LOGS section to collapsed', () => {
    expect(HISTORY_SECTION_DEFAULT_EXPANDED).toBe(false);
  });

  it('uses de-boxed soft tiles and borderless summary pills', () => {
    expect(HISTORY_COLLAPSIBLE_CHROME.headerToggle).toContain('rounded-xl');
    expect(HISTORY_COLLAPSIBLE_CHROME.headerToggle).toContain('border-white/[0.06]');
    expect(HISTORY_COLLAPSIBLE_CHROME.headerToggle).toContain('bg-white/[0.03]');
    expect(HISTORY_COLLAPSIBLE_CHROME.headerPanel).toContain('border-white/[0.06]');
    expect(HISTORY_COLLAPSIBLE_CHROME.headerToggle.startsWith(HISTORY_COLLAPSIBLE_CHROME.headerPanel)).toBe(
      true
    );
    expect(HISTORY_COLLAPSIBLE_CHROME.pill).toContain('border-0');
    expect(HISTORY_COLLAPSIBLE_CHROME.pill).toContain('bg-white/[0.05]');
    expect(HISTORY_COLLAPSIBLE_CHROME.kicker).toContain('whitespace-nowrap');
    expect(HISTORY_COLLAPSIBLE_CHROME.headerTitleStack).toContain('min-w-0');
    expect(HISTORY_COLLAPSIBLE_CHROME.headerTitleStack).toContain('flex-1');
    expect(HISTORY_COLLAPSIBLE_CHROME.title).toContain('truncate');
    expect(HISTORY_COLLAPSIBLE_CHROME.chevronBadge).toContain('rounded-full');
    expect(HISTORY_COLLAPSIBLE_CHROME.chevronBadge).toContain('h-6');
    expect(HISTORY_COLLAPSIBLE_CHROME.headerActions).toContain('gap-2');
  });
});
