import { describe, expect, it } from 'vitest';
import { buildDynoIntelLocalTelemetry } from '../dynoIntelLocalTelemetry';

describe('buildDynoIntelLocalTelemetry', () => {
  it('marks all rows active when the full local uplink is ready', () => {
    const rows = buildDynoIntelLocalTelemetry({
      clientDev: true,
      clientBypass: true,
      emulatorEnabled: true,
      googleLinked: true,
      proSurfaceUnlocked: true,
    });
    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.active)).toBe(true);
  });

  it('trips pro surface when google auth is missing even with client bypass', () => {
    const rows = buildDynoIntelLocalTelemetry({
      clientDev: true,
      clientBypass: true,
      emulatorEnabled: true,
      googleLinked: false,
      proSurfaceUnlocked: false,
    });
    expect(rows.find((row) => row.id === 'googleAuth')?.active).toBe(false);
    expect(rows.find((row) => row.id === 'proSurface')?.active).toBe(false);
  });

  it('keeps production client dev row off while beta bypass can still be active', () => {
    const rows = buildDynoIntelLocalTelemetry({
      clientDev: false,
      clientBypass: true,
      emulatorEnabled: false,
      googleLinked: true,
      proSurfaceUnlocked: true,
    });
    expect(rows.find((row) => row.id === 'clientDev')?.active).toBe(false);
    expect(rows.find((row) => row.id === 'clientBypass')?.active).toBe(true);
  });
});
