/**
 * Console radar / 2×3 HUD lexicon mode (WHY): Fitness-first by default; telemetry
 * is an opt-in mechanical overlay — never changes score math, only copy.
 */
export type ConsoleAxisViewMode = 'fitness' | 'telemetry';

export const DEFAULT_CONSOLE_AXIS_VIEW_MODE: ConsoleAxisViewMode = 'fitness';

export const CONSOLE_AXIS_VIEW_MODES = ['fitness', 'telemetry'] as const satisfies readonly ConsoleAxisViewMode[];

export function parseConsoleAxisViewMode(
  raw: string | null | undefined
): ConsoleAxisViewMode {
  return raw === 'telemetry' ? 'telemetry' : DEFAULT_CONSOLE_AXIS_VIEW_MODE;
}

export function isConsoleAxisViewMode(value: unknown): value is ConsoleAxisViewMode {
  return value === 'fitness' || value === 'telemetry';
}

/**
 * Console 2×3 HUD readout (WHY): Forced 2dp so 71.4 / 71 paint as 71.40 — shared
 * presentation contract with lobby glance, kept here so i18n resolvers stay copy-only.
 */
export function formatConsoleAxisHudValue(value: number): string {
  if (!Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}
