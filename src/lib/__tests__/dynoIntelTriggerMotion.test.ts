import { describe, expect, it } from 'vitest';
import {
  DYNO_INTEL_TRIGGER_MORPH_SCALE_X,
  dynoIntelTriggerCrosshairVisible,
  dynoIntelTriggerMorphScaleX,
  dynoIntelTriggerSinkClasses,
  dynoIntelTriggerTickerVisible,
} from '../dynoIntelTriggerMotion';

describe('dynoIntelTriggerMotion', () => {
  it('derives circle scale from fixed pill/circle rem ratio', () => {
    expect(DYNO_INTEL_TRIGGER_MORPH_SCALE_X).toBeCloseTo(2.25 / 7, 5);
    expect(dynoIntelTriggerMorphScaleX(false)).toBe(DYNO_INTEL_TRIGGER_MORPH_SCALE_X);
    expect(dynoIntelTriggerMorphScaleX(true)).toBe(1);
  });

  it('crossfades crosshair and ticker on opposite visibility classes', () => {
    expect(dynoIntelTriggerCrosshairVisible(false)).toContain('opacity-100');
    expect(dynoIntelTriggerCrosshairVisible(true)).toContain('opacity-0');
    expect(dynoIntelTriggerTickerVisible(true)).toContain('opacity-100');
    expect(dynoIntelTriggerTickerVisible(false)).toContain('opacity-0');
  });

  it('sinks trigger wrapper when sheet is open', () => {
    const open = dynoIntelTriggerSinkClasses(true, false);
    expect(open.wrapper).toContain('opacity-0');
    expect(open.interactive).toBe(false);

    const closed = dynoIntelTriggerSinkClasses(false, false);
    expect(closed.wrapper).toContain('opacity-100');
    expect(closed.interactive).toBe(true);
  });
});
