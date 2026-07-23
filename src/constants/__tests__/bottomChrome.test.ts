import { describe, expect, it } from 'vitest';
import {
  APP_SHELL_SCROLL_BOTTOM_PX,
  BOTTOM_CHROME_AIR_GAP_PX,
  BOTTOM_CHROME_STACK_PX,
  BOTTOM_HEX_PROTRUSION_PX,
  BOTTOM_HEX_TOP_PX,
  BOTTOM_NAV_SHELL_PX,
  DYNO_INTEL_TRIGGER_HEIGHT_PX,
  LADDER_BRIDGE_AIR_GAP_PX,
  LADDER_BRIDGE_ARCH_DEPTH_PX,
  LADDER_BRIDGE_BOTTOM_PX,
  LADDER_FLOATING_RANK_BAR_PX,
  LADDER_SCROLL_BOTTOM_INSET_PX,
  bottomChromeCalc,
} from '../bottomChrome';

describe('bottomChrome', () => {
  it('keeps stack math derived from nav shell + air gap', () => {
    expect(BOTTOM_CHROME_STACK_PX).toBe(BOTTOM_NAV_SHELL_PX + BOTTOM_CHROME_AIR_GAP_PX);
  });

  it('places hex top from nav shell + protrusion', () => {
    expect(BOTTOM_HEX_TOP_PX).toBe(BOTTOM_NAV_SHELL_PX + BOTTOM_HEX_PROTRUSION_PX);
  });

  it('keeps bridge arch apex 8–12px above the hex top', () => {
    const apex = LADDER_BRIDGE_BOTTOM_PX + LADDER_BRIDGE_ARCH_DEPTH_PX;
    const air = apex - BOTTOM_HEX_TOP_PX;
    expect(air).toBe(LADDER_BRIDGE_AIR_GAP_PX);
    expect(air).toBeGreaterThanOrEqual(8);
    expect(air).toBeLessThanOrEqual(12);
  });

  it('derives bridge bottom from hex top, air gap, and arch depth', () => {
    expect(LADDER_BRIDGE_BOTTOM_PX).toBe(
      BOTTOM_HEX_TOP_PX + LADDER_BRIDGE_AIR_GAP_PX - LADDER_BRIDGE_ARCH_DEPTH_PX,
    );
  });

  it('clears Dyno Intel chip for default AppShell scroll inset', () => {
    expect(APP_SHELL_SCROLL_BOTTOM_PX).toBe(
      BOTTOM_CHROME_STACK_PX + DYNO_INTEL_TRIGGER_HEIGHT_PX,
    );
  });

  it('clears bridge floating rank for ladder scroll / IO inset', () => {
    expect(LADDER_SCROLL_BOTTOM_INSET_PX).toBe(
      LADDER_BRIDGE_BOTTOM_PX + LADDER_FLOATING_RANK_BAR_PX,
    );
  });

  it('formats safe-area calc without duplicating env() at call sites', () => {
    expect(bottomChromeCalc(BOTTOM_CHROME_STACK_PX)).toBe(
      `calc(${BOTTOM_CHROME_STACK_PX}px + env(safe-area-inset-bottom, 0px))`,
    );
  });
});
