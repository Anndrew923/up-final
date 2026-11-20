/**
 * Shared LOGS collapsible section chrome.
 *
 * WHY: Footprint / Evolution / Archive must stay visually identical — one token
 * map prevents the three headers from drifting apart on the next polish pass.
 * De-boxed: soft fill + hairline only (no heavy nested rings / pill borders).
 */

/** First-paint density SSOT — all three LOGS sections start collapsed. */
export const HISTORY_SECTION_DEFAULT_EXPANDED = false;

const HEADER_SURFACE =
  'flex w-full flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 sm:p-3.5';

export const HISTORY_COLLAPSIBLE_CHROME = {
  pill: 'whitespace-nowrap rounded-full border-0 bg-white/[0.05] px-2.5 py-0.5 font-mono text-[11px] tabular-nums text-zinc-300 sm:text-xs',
  kicker:
    'block whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-accent-primary/90',
  title:
    'mt-0.5 block whitespace-nowrap text-base font-semibold tracking-tight text-zinc-100 sm:text-lg',
  headerTopRow: 'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3',
  headerPillsRow: 'flex w-full flex-wrap items-center gap-2 pt-0.5',
  /**
   * Full-width toggle button shell (Footprint / Archive).
   * Design intent: soft dashboard tile — depth from fill, not stacked borders.
   */
  headerToggle: `${HEADER_SURFACE} text-left transition-[background-color,transform] duration-150 hover:bg-white/[0.05] active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-info/60`,
  /** Non-button panel shell when Share must sit beside the chevron (Evolution). */
  headerPanel: HEADER_SURFACE,
  chevronBadge:
    'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10',
  chevronIcon: 'h-3.5 w-3.5 shrink-0 text-amber-500',
} as const;
