import { describe, expect, it } from 'vitest';
import {
  BILINGUAL_TITLE_BLOCK_PX,
  fitBoldFontSize,
  resolveDualHeroGeom,
} from '../telemetrySingleLeafDualHero';
import type { TelemetryDrawContext } from '../telemetryCardTypes';

describe('telemetrySingleLeafDualHero', () => {
  it('reduces bold font size until the string fits maxWidth', () => {
    const state = { font: '' };
    const ctx = {
      get font() {
        return state.font;
      },
      set font(v: string) {
        state.font = v;
      },
      measureText() {
        const size = Number(/(\d+)px/.exec(state.font)?.[1] ?? 16);
        // At 58px the string is 400 wide; width scales linearly with px.
        return { width: (400 / 58) * size };
      },
    } as unknown as TelemetryDrawContext;

    const size = fitBoldFontSize(ctx, '140.5 KG × 10', 200, 58, 28, 'sans-serif');
    expect(size).toBeLessThan(58);
    expect(size).toBeGreaterThanOrEqual(28);
    expect((400 / 58) * size).toBeLessThanOrEqual(200);
  });

  it('resolves equal-width dual columns with a center divider', () => {
    const geom = resolveDualHeroGeom(96, 984, 600, 850);
    expect(geom.dividerX).toBe(540);
    expect(geom.leftCx).toBeCloseTo(96 + (984 - 96 - 28) / 4, 5);
    expect(geom.rightCx).toBeCloseTo(984 - (984 - 96 - 28) / 4, 5);
    expect(geom.colMaxW).toBeGreaterThan(0);
    expect(geom.valueY).toBeGreaterThan(geom.labelY);
    expect(geom.capsuleY).toBeGreaterThan(geom.valueY);
  });

  it('exports a stable bilingual title block height for rhythm math', () => {
    expect(BILINGUAL_TITLE_BLOCK_PX).toBe(52);
  });
});
