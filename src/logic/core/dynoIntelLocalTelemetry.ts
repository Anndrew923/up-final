export const DYNO_INTEL_TELEMETRY_ROW_IDS = [
  'clientDev',
  'clientBypass',
  'emulator',
  'googleAuth',
  'proSurface',
] as const;

export type DynoIntelTelemetryRowId = (typeof DYNO_INTEL_TELEMETRY_ROW_IDS)[number];

export interface DynoIntelTelemetryRow {
  id: DynoIntelTelemetryRowId;
  active: boolean;
}

export interface BuildDynoIntelLocalTelemetryInput {
  clientDev: boolean;
  clientBypass: boolean;
  emulatorEnabled: boolean;
  googleLinked: boolean;
  proSurfaceUnlocked: boolean;
}

/**
 * Pure telemetry row builder — keeps debug panel scannable and unit-testable.
 */
export function buildDynoIntelLocalTelemetry(
  input: BuildDynoIntelLocalTelemetryInput
): DynoIntelTelemetryRow[] {
  return [
    { id: 'clientDev', active: input.clientDev },
    { id: 'clientBypass', active: input.clientBypass },
    { id: 'emulator', active: input.emulatorEnabled },
    { id: 'googleAuth', active: input.googleLinked },
    { id: 'proSurface', active: input.proSurfaceUnlocked },
  ];
}
