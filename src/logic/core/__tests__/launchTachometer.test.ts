import { describe, expect, it } from 'vitest';
import {
  TACH_COLOR_CYAN,
  TACH_COLOR_GOLD,
  TACH_COLOR_RED,
  TACH_BEZEL_GOLD_CHAMFER_STROKE,
  TACH_BRIDGE_HIGHLIGHT_PATHS,
  TACH_BRIDGE_METAL,
  TACH_BRIDGE_PATHS,
  TACH_CREST_CUP_INNER_R,
  TACH_CREST_CUP_MID_R,
  TACH_CREST_CUP_OUTER_R,
  TACH_CREST_GOLD,
  TACH_CREST_GOLD_HI,
  TACH_CREST_GOLD_LO,
  TACH_CHROME_GOLD_CLASS,
  TACH_CHROME_GOLD_MUTED_CLASS,
  TACH_CREST_LIT,
  TACH_CREST_LIT_CLASS,
  TACH_END_DEG,
  TACH_GEAR_RATIO,
  TACH_JEWELS,
  TACH_KNURL_COUNT,
  TACH_KNURL_TICKS,
  TACH_METAL_EDGE,
  TACH_METAL_MIRROR,
  TACH_METAL_SLOT,
  TACH_METAL_STEEL,
  TACH_METAL_TITANIUM,
  TACH_MOVEMENT_PLATE_R,
  TACH_OUTER_RAIL_PATH,
  TACH_PRIMARY_GEAR,
  TACH_REDLINE_ARC_PATH,
  TACH_REDLINE_END_DEG,
  TACH_REDLINE_PULSE_CLASS,
  TACH_REDLINE_START_DEG,
  TACH_R_GEAR_PRIMARY_HUB,
  TACH_SCREWS,
  TACH_SECONDARY_GEAR,
  TACH_SEGMENT_COUNT,
  TACH_SEGMENTS,
  TACH_START_DEG,
  TACH_TICKS,
  buildHexPoints,
  buildSolidGearPath,
  describeCirclePath,
  formatLaunchHudPrimary,
  formatLaunchHudSecondary,
  formatLaunchProgressPercent,
  isClockwiseLabelOrder,
  isLaunchRedline,
  isSegmentLit,
  isTachLabelLit,
  isZhLaunchLocale,
  polar,
  progressToNeedleRotateDeg,
  progressToPrimaryGearRotateDeg,
  progressToSecondaryGearRotateDeg,
  progressToTachAngleDeg,
  rpmBand,
} from '../launchTachometer';

/** Tooth outline Z + hub bore Z + one Z per spoke window. */
function solidGearClosureCount(spokeCount: number): number {
  return 2 + spokeCount;
}

describe('launchTachometer geometry', () => {
  it('sweeps clockwise 7 o\'clock → 12 → 5 o\'clock (150° → 390°)', () => {
    expect(TACH_START_DEG).toBe(150);
    expect(TACH_END_DEG).toBe(390);
    expect(progressToTachAngleDeg(0)).toBe(150);
    expect(progressToTachAngleDeg(0.5)).toBe(270);
    expect(progressToTachAngleDeg(1)).toBe(390);
    // UI degrees strictly increase with progress (clockwise contract).
    expect(progressToTachAngleDeg(0.25)).toBeGreaterThan(progressToTachAngleDeg(0));
    expect(progressToTachAngleDeg(0.75)).toBeGreaterThan(progressToTachAngleDeg(0.25));
    // Needle SVG rotate also increases (CW from up).
    expect(progressToNeedleRotateDeg(0)).toBe(150 - 270);
    expect(progressToNeedleRotateDeg(1)).toBe(390 - 270);
    expect(progressToNeedleRotateDeg(1)).toBeGreaterThan(progressToNeedleRotateDeg(0));
  });

  it('places 0 at lower-left and 9 at lower-right (never under the dial floor)', () => {
    const zero = polar(160, 158, 100, progressToTachAngleDeg(0));
    const mid = polar(160, 158, 100, progressToTachAngleDeg(0.5));
    const nine = polar(160, 158, 100, progressToTachAngleDeg(1));
    expect(zero.x).toBeLessThan(160);
    expect(zero.y).toBeGreaterThan(158);
    expect(mid.y).toBeLessThan(158); // crown / 12 o'clock
    expect(nine.x).toBeGreaterThan(160);
    expect(nine.y).toBeGreaterThan(158);
  });

  it('orders major labels clockwise by increasing UI angle', () => {
    expect(isClockwiseLabelOrder()).toBe(true);
    const majors = TACH_TICKS.filter((t) => t.label != null);
    expect(majors[0]?.label?.n).toBe(0);
    expect(majors[majors.length - 1]?.label?.n).toBe(9);
  });

  it('formats digital percent and frameless HUD copy', () => {
    expect(formatLaunchProgressPercent(0)).toBe('000%');
    expect(formatLaunchProgressPercent(0.42)).toBe('042%');
    expect(formatLaunchProgressPercent(1)).toBe('100%');
    expect(isLaunchRedline(0.998)).toBe(false);
    expect(isLaunchRedline(1)).toBe(true);
    expect(formatLaunchHudPrimary(0.56)).toBe('056%');
    expect(formatLaunchHudSecondary(0.56)).toBe('SYS.IGNITION');
    expect(formatLaunchHudPrimary(1)).toBe('REDLINE // READY');
    expect(formatLaunchHudSecondary(1)).toBeNull();
  });

  it('precomputes dial ticks, knurl, solid gears, bridges, crest cup, and 45 cells', () => {
    expect(TACH_TICKS.filter((t) => t.major)).toHaveLength(10);
    expect(TACH_REDLINE_START_DEG).toBe(progressToTachAngleDeg(7.5 / 9));
    expect(TACH_REDLINE_END_DEG).toBe(390);
    expect(TACH_KNURL_TICKS).toHaveLength(TACH_KNURL_COUNT);
    expect(TACH_KNURL_COUNT).toBe(120);
    expect(TACH_PRIMARY_GEAR.teeth).toBe(20);
    expect(TACH_SECONDARY_GEAR.teeth).toBe(12);
    expect(TACH_PRIMARY_GEAR.hubR).toBe(TACH_R_GEAR_PRIMARY_HUB);
    expect(TACH_PRIMARY_GEAR.spokeCount).toBe(5);
    expect(TACH_SECONDARY_GEAR.spokeCount).toBe(4);
    expect(TACH_PRIMARY_GEAR.bodyPath.startsWith('M ')).toBe(true);
    expect(TACH_PRIMARY_GEAR.bodyPath.match(/\bZ\b/g)?.length).toBe(
      solidGearClosureCount(TACH_PRIMARY_GEAR.spokeCount)
    );
    expect(TACH_SECONDARY_GEAR.bodyPath.match(/\bZ\b/g)?.length).toBe(
      solidGearClosureCount(TACH_SECONDARY_GEAR.spokeCount)
    );
    expect(TACH_MOVEMENT_PLATE_R).toBeGreaterThan(60);
    expect(TACH_CREST_CUP_OUTER_R).toBeGreaterThan(TACH_CREST_CUP_MID_R);
    expect(TACH_CREST_CUP_MID_R).toBeGreaterThan(TACH_CREST_CUP_INNER_R);
    expect(TACH_CREST_CUP_INNER_R).toBeLessThan(TACH_MOVEMENT_PLATE_R);
    expect(TACH_JEWELS.length).toBe(4);
    expect(TACH_JEWELS.some((j) => j.tone === 'cyan')).toBe(true);
    expect(TACH_JEWELS.some((j) => j.tone === 'red')).toBe(true);
    expect(TACH_SCREWS.length).toBeGreaterThanOrEqual(4);
    expect(TACH_SCREWS.length).toBeLessThanOrEqual(6);
    expect(TACH_SCREWS.every((s) => s.hexPoints.split(/\s+/).length === 6)).toBe(true);
    expect(TACH_BRIDGE_PATHS).toHaveLength(2);
    expect(TACH_BRIDGE_HIGHLIGHT_PATHS).toHaveLength(2);
    expect(TACH_BRIDGE_PATHS.every((d) => d.includes('Z'))).toBe(true);
    expect(TACH_BRIDGE_METAL).toBe('titanium');
    expect(TACH_METAL_MIRROR).toBe('#F8FAFC');
    expect(TACH_METAL_TITANIUM).toBe('#94A3B8');
    expect(TACH_METAL_STEEL).toBe('#334155');
    expect(TACH_METAL_SLOT).toBe('#0F172A');
    expect(TACH_METAL_EDGE).toBe('#E2E8F0');
    expect(TACH_CREST_GOLD_HI).toBe('#FFF2C2');
    expect(TACH_CREST_GOLD).toBe('#D4AF37');
    expect(TACH_CREST_GOLD_LO).toBe('#5C4714');
    expect(TACH_CREST_LIT).toBe('#F8E7A8');
    expect(TACH_CREST_LIT_CLASS).toContain(TACH_CREST_LIT);
    expect(TACH_CHROME_GOLD_CLASS).toContain(TACH_COLOR_GOLD);
    expect(TACH_CHROME_GOLD_MUTED_CLASS).toContain(TACH_COLOR_GOLD);
    expect(TACH_REDLINE_PULSE_CLASS).toContain('animate-pulse');
    expect(TACH_BEZEL_GOLD_CHAMFER_STROKE).toBe(0.8);
    expect(TACH_SEGMENTS).toHaveLength(TACH_SEGMENT_COUNT);
    expect(TACH_OUTER_RAIL_PATH.startsWith('M ')).toBe(true);
    expect(TACH_REDLINE_ARC_PATH.startsWith('M ')).toBe(true);
  });

  it('builds evenodd solid gear paths with hub bore and spoke cutouts', () => {
    const path = buildSolidGearPath(0, 0, 8, 20, 16, 12, 5, 3);
    expect(path.match(/\bZ\b/g)?.length).toBe(solidGearClosureCount(3));
    expect(path).toContain(describeCirclePath(0, 0, 5, true));
    expect(buildHexPoints(10, 20, 4).split(/\s+/)).toHaveLength(6);
  });

  it('assigns cyan → gold → red bands across the shift-light arc', () => {
    expect(rpmBand(2)).toBe('cyan');
    expect(rpmBand(5)).toBe('gold');
    expect(rpmBand(8)).toBe('red');
    expect(TACH_SEGMENTS[0]?.litColor).toBe(TACH_COLOR_CYAN);
    const cyan = TACH_SEGMENTS.filter((s) => s.band === 'cyan');
    const gold = TACH_SEGMENTS.filter((s) => s.band === 'gold');
    const red = TACH_SEGMENTS.filter((s) => s.band === 'red');
    expect(cyan.length + gold.length + red.length).toBe(TACH_SEGMENT_COUNT);
    expect(gold[0]?.litColor).toBe(TACH_COLOR_GOLD);
    expect(red[0]?.litColor).toBe(TACH_COLOR_RED);
    // Segment UI angles also increase clockwise along the arc.
    expect(TACH_SEGMENTS[1]!.startDeg).toBeGreaterThan(TACH_SEGMENTS[0]!.startDeg);
  });

  it('lights segments and numerals only after the needle sweeps past them', () => {
    const first = TACH_SEGMENTS[0]!;
    const last = TACH_SEGMENTS[TACH_SEGMENTS.length - 1]!;
    expect(isSegmentLit(first, 0)).toBe(true);
    expect(isSegmentLit(last, 0.5)).toBe(false);
    expect(isSegmentLit(last, 1)).toBe(true);
    expect(isTachLabelLit(0, 0)).toBe(true);
    expect(isTachLabelLit(5, 0.4)).toBe(false);
    expect(isTachLabelLit(5, 0.56)).toBe(true);
  });

  it('meshes primary / secondary gears with reverse tooth ratio', () => {
    expect(progressToPrimaryGearRotateDeg(0)).toBe(0);
    expect(progressToPrimaryGearRotateDeg(1)).toBe(54);
    expect(progressToSecondaryGearRotateDeg(1)).toBe(-54 * TACH_GEAR_RATIO);
    expect(progressToSecondaryGearRotateDeg(0.5)).toBeLessThan(0);
    expect(progressToPrimaryGearRotateDeg(0.5)).toBeGreaterThan(0);
  });

  it('treats zh* locales as Chinese quote lane', () => {
    expect(isZhLaunchLocale('zh-Hant')).toBe(true);
    expect(isZhLaunchLocale('en')).toBe(false);
    expect(isZhLaunchLocale(undefined)).toBe(true);
  });
});
