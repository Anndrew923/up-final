import type { DynoIntelContextV1, DynoIntelMode } from './dynoIntelTypes';

/** Resolves persisted log focus axis from enriched context at send time. */
export function resolveDynoIntelLogFocusAxis(
  context: Pick<DynoIntelContextV1, 'focusAxis' | 'questionFocusAxis'>,
  mode: DynoIntelMode
): string {
  return (
    context.focusAxis ??
    context.questionFocusAxis ??
    (mode === 'cross-axis' ? 'cross-axis' : 'unknown')
  );
}
