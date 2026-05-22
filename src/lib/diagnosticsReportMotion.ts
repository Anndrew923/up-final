/** Shared motion tokens for the post-ritual diagnostics report panel. */
export const DIAGNOSTICS_PANEL_TRANSITION =
  'motion-safe:transition-[opacity,transform] motion-safe:duration-[600ms] motion-safe:ease-report-ease motion-reduce:transition-none';

export const DIAGNOSTICS_STAGGER_TRANSITION =
  'motion-safe:transition-[opacity,transform] motion-safe:duration-500 motion-safe:ease-report-ease motion-reduce:transition-none';

/** Longest stagger delay + panel duration — safe point to drop `will-change`. */
export const DIAGNOSTICS_ENTRANCE_MS = 850;

export const DIAGNOSTICS_STAGGER_DELAY_MS = {
  header: 100,
  body: 180,
  footer: 250,
} as const;

export type DiagnosticsStaggerAxis = 'y' | 'x';

/**
 * Opacity + translate classes for a stagger block. Reduced-motion users start with `entered=true`.
 */
export function diagnosticsStaggerVisible(
  entered: boolean,
  axis: DiagnosticsStaggerAxis
): string {
  if (entered) {
    return axis === 'y' ? 'opacity-100 translate-y-0' : 'opacity-100 translate-x-0';
  }
  return axis === 'y' ? 'opacity-0 translate-y-2.5' : 'opacity-0 -translate-x-3';
}

export function diagnosticsPanelVisible(entered: boolean): string {
  return entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5';
}

export function diagnosticsWillChange(active: boolean): string {
  return active ? 'will-change-[transform,opacity]' : '';
}
