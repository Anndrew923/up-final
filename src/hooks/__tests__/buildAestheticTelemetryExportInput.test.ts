import { describe, expect, it, vi } from 'vitest';
import type { AestheticSpecCardModel } from '../useAestheticSpecCard';
import { buildAestheticTelemetryExportInput } from '../buildAestheticTelemetryExportInput';

const model: AestheticSpecCardModel = {
  overallScore: 80,
  battleCode: 'UP-Test #0001',
  gender: 'male',
  bodyFatPct: 10,
  spec: {
    overallTitleId: 'peakMortal',
    visual: { id: 'assassin', score: 88, unmeasured: false, bodyFatMissing: false },
    force: { id: '80', score: 85, unmeasured: false },
    kinetic: { id: '70', score: 72, unmeasured: false },
    hasTitanGrip: false,
    peakKg: null,
  },
};

describe('buildAestheticTelemetryExportInput', () => {
  it('maps certificate model + scores into a compose payload', () => {
    const t = vi.fn((key: string) => key) as unknown as typeof import('i18next').t;
    const input = buildAestheticTelemetryExportInput(
      t,
      model,
      {
        strength: 80,
        explosivePower: 70,
        cardio: 60,
        muscleMass: 75,
        bodyFat: 82,
        gripStrength: 50,
      },
      { mode: 'carbon' }
    );

    expect(input.mode).toBe('carbon');
    expect(input.battleCode).toBe('UP-Test #0001');
    expect(input.overallScore).toBe(80);
    expect(input.title).toBe('aesthetic.overall.peakMortal');
    expect(input.specs).toHaveLength(3);
    expect(input.axes).toHaveLength(6);
    expect(input.axes[0]?.key).toBe('strength');
  });
});
