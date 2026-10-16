/**
 * Shared underline-tab classes for Ladder division picker + Club dimension funnel.
 * WHY: One visual contract — avoid drift between global ladder and club standings.
 */
export function ladderDivisionTabClass(active: boolean): string {
  const base =
    'shrink-0 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all sm:px-3 sm:py-2 sm:text-xs sm:tracking-widest';
  if (active) {
    return `${base} border-b-2 border-red-500 bg-gradient-to-t from-red-500/15 to-transparent text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]`;
  }
  return `${base} border-b-2 border-zinc-800 bg-transparent text-zinc-500 hover:border-zinc-600 hover:text-zinc-300`;
}
