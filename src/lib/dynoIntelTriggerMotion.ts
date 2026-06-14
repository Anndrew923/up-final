/**
 * DYNO INTEL floating trigger + bottom sheet motion tokens.
 *
 * Design intent (WHY): Morph uses transform-only (scaleX) so pill ↔ circle never
 * triggers layout; sheet + trigger share report-ease for W212-style damping.
 */

/** Full pill width (`w-28`) in rem — chassis footprint locked on the right edge. */
export const DYNO_INTEL_TRIGGER_PILL_WIDTH_REM = 7;

/** Collapsed circle visual width (`w-9`) in rem. */
export const DYNO_INTEL_TRIGGER_CIRCLE_WIDTH_REM = 2.25;

/** scaleX from pill → circle with `transform-origin: right center`. */
export const DYNO_INTEL_TRIGGER_MORPH_SCALE_X =
  DYNO_INTEL_TRIGGER_CIRCLE_WIDTH_REM / DYNO_INTEL_TRIGGER_PILL_WIDTH_REM;

export const DYNO_INTEL_TRIGGER_MORPH_MS = 300;
export const DYNO_INTEL_TRIGGER_SINK_MS = 300;
export const DYNO_INTEL_SHEET_SLIDE_MS = 350;

/** Tailwind `duration-300` / `duration-[350ms]` must stay in sync with the *_MS constants above. */

export const DYNO_INTEL_TRIGGER_MORPH_TRANSITION =
  'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-report-ease motion-reduce:transition-none';

export const DYNO_INTEL_TRIGGER_CONTENT_TRANSITION =
  'motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-report-ease motion-reduce:transition-none';

export const DYNO_INTEL_TRIGGER_SINK_TRANSITION =
  'motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-report-ease motion-reduce:transition-none';

export const DYNO_INTEL_SHEET_PANEL_TRANSITION =
  'motion-safe:transition-[opacity,transform] motion-safe:duration-[350ms] motion-safe:ease-report-ease motion-reduce:transition-none';

export const DYNO_INTEL_SHEET_SCRIM_TRANSITION =
  'motion-safe:transition-opacity motion-safe:duration-[350ms] motion-safe:ease-report-ease motion-reduce:transition-none';

export function dynoIntelTriggerMorphScaleX(expanded: boolean): number {
  return expanded ? 1 : DYNO_INTEL_TRIGGER_MORPH_SCALE_X;
}

/** Compositor hint — only while morph / sink / crossfade is active. */
export function dynoIntelTriggerWillChange(active: boolean): string {
  return active ? 'will-change-[transform,opacity]' : '';
}

export function dynoIntelTriggerSinkClasses(
  sheetOpen: boolean,
  reducedMotion: boolean,
): { wrapper: string; interactive: boolean } {
  if (reducedMotion) {
    return {
      wrapper: sheetOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 translate-y-0',
      interactive: !sheetOpen,
    };
  }
  return {
    wrapper: sheetOpen
      ? 'opacity-0 translate-y-3 pointer-events-none'
      : 'opacity-100 translate-y-0',
    interactive: !sheetOpen,
  };
}

export function dynoIntelTriggerCrosshairVisible(expanded: boolean): string {
  return expanded
    ? 'pointer-events-none scale-90 opacity-0'
    : 'scale-100 opacity-100';
}

export function dynoIntelTriggerTickerVisible(expanded: boolean): string {
  return expanded
    ? 'scale-100 opacity-100'
    : 'pointer-events-none scale-105 opacity-0';
}

export function dynoIntelSheetPanelVisible(visible: boolean): string {
  return visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0';
}

export function dynoIntelSheetScrimVisible(visible: boolean): string {
  return visible ? 'opacity-100' : 'opacity-0';
}
