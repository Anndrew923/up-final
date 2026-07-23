import { describe, expect, it } from 'vitest';
import {
  APP_SHELL_SCROLL_BOTTOM_PX,
  BOTTOM_CHROME_AIR_GAP_PX,
  BOTTOM_CHROME_STACK_PX,
  BOTTOM_NAV_SHELL_PX,
  DYNO_INTEL_TRIGGER_HEIGHT_PX,
  LADDER_FLOATING_RANK_BAR_PX,
  LADDER_SCROLL_BOTTOM_INSET_PX,
  bottomChromeCalc,
} from '../bottomChrome';

describe('bottomChrome', () => {
  it('keeps stack math derived from nav shell + air gap', () => {
    expect(BOTTOM_CHROME_STACK_PX).toBe(BOTTOM_NAV_SHELL_PX + BOTTOM_CHROME_AIR_GAP_PX);
  });

  it('clears Dyno Intel chip for default AppShell scroll inset', () => {
    expect(APP_SHELL_SCROLL_BOTTOM_PX).toBe(
      BOTTOM_CHROME_STACK_PX + DYNO_INTEL_TRIGGER_HEIGHT_PX,
    );
  });

  it('clears dual-pill floating rank for ladder scroll / IO inset', () => {
    expect(LADDER_SCROLL_BOTTOM_INSET_PX).toBe(
      BOTTOM_CHROME_STACK_PX + LADDER_FLOATING_RANK_BAR_PX,
    );
  });

  it('formats safe-area calc without duplicating env() at call sites', () => {
    expect(bottomChromeCalc(106)).toBe('calc(106px + env(safe-area-inset-bottom, 0px))');
  });
});
