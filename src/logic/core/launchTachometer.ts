/**
 * Pure tachometer geometry for the launch splash dial.
 * WHY: Keep angle/percent/segment math framework-free so UI cannot drift from unit-tested polar contracts.
 *
 * Angle contract (UI degrees, increase = clockwise on screen through the crown):
 * - 0 RPM at 7 o'clock = 150°
 * - mid (4.5) at 12 o'clock = 270°
 * - 9 RPM at 5 o'clock = 390° (≡ 30°)
 */

/** Needle sweep to redline (ms). */
export const LAUNCH_NEEDLE_MS = 800;
/** Minimum reading window before auto-dismiss (ms). */
export const LAUNCH_HOLD_MS = 1500;
/** Fade-out duration (ms) — keep in lockstep with Tailwind `duration-300`. */
export const LAUNCH_FADE_MS = 300;

/** Classic 240° mid-dial: 7 o'clock → 12 → 5 o'clock (clockwise). */
export const TACH_SWEEP_DEG = 240;
export const TACH_START_DEG = 150;
export const TACH_END_DEG = TACH_START_DEG + TACH_SWEEP_DEG; // 390
export const TACH_MAX_RPM = 9;
export const TACH_REDLINE_RPM = 7.5;
/** Champagne → redline band starts here (RPM). */
export const TACH_GOLD_RPM = 5;

/** Shift-light cells along the 0→9 sweep. */
export const TACH_SEGMENT_COUNT = 45;
/** Bezel knurling tooth count. */
export const TACH_KNURL_COUNT = 120;

export const TACH_COLOR_CYAN = '#00E5FF';
export const TACH_COLOR_GOLD = '#F3D078';
export const TACH_COLOR_RED = '#FF2A55';
export const TACH_SEGMENT_DIM = 'rgba(255,255,255,0.08)';

/**
 * Two-tone metal tokens — cold titanium movement vs champagne crest focus.
 * WHY: Keep dial fill/stroke hexes in logic so UI + tests cannot drift apart.
 */
export const TACH_METAL_MIRROR = '#F8FAFC';
export const TACH_METAL_TITANIUM = '#94A3B8';
export const TACH_METAL_STEEL = '#334155';
export const TACH_METAL_SLOT = '#0F172A';
/** Shared bright edge for gears + titanium bridge crowns. */
export const TACH_METAL_EDGE = '#E2E8F0';
export const TACH_CREST_GOLD_HI = '#FFF2C2';
export const TACH_CREST_GOLD = '#D4AF37';
export const TACH_CREST_GOLD_LO = '#5C4714';
/** Lit crest stroke under the needle hub — brighter than plate gold so UP stays readable. */
export const TACH_CREST_LIT = '#F8E7A8';
/**
 * Static Tailwind arbitrary classes (literal hex for JIT).
 * WHY: Runtime string concat is invisible to Tailwind; unit tests lock these to TACH_* tokens.
 */
export const TACH_CREST_LIT_CLASS = 'text-[#F8E7A8]' as const;
export const TACH_CHROME_GOLD_CLASS = 'text-[#F3D078]' as const;
export const TACH_CHROME_GOLD_MUTED_CLASS = 'text-[#F3D078]/35' as const;
export const TACH_BRIDGE_METAL = 'titanium' as const;
export const TACH_BEZEL_GOLD_CHAMFER_STROKE = 0.8;
/** Redline hold pulse — motion-safe so reduced-motion users stay steady. */
export const TACH_REDLINE_PULSE_CLASS =
  'motion-safe:animate-pulse motion-reduce:animate-none' as const;

export const TACH_VIEWBOX = { width: 320, height: 300 } as const;
export const TACH_CX = 160;
export const TACH_CY = 158;
export const TACH_R_OUTER = 118;
export const TACH_R_TICK_OUTER = 112;
export const TACH_R_TICK_INNER_MAJOR = 96;
export const TACH_R_TICK_INNER_MINOR = 102;
export const TACH_R_LABEL = 84;
export const TACH_R_NEEDLE = 100;
/** Segmented shift-light arc radii (inside major ticks). */
export const TACH_R_SEGMENT_OUTER = 94;
export const TACH_R_SEGMENT_INNER = 86;
/** Primary / secondary solid gear radii (tip / root / rim / hub). */
export const TACH_R_GEAR_PRIMARY_OUTER = 36;
export const TACH_R_GEAR_PRIMARY_ROOT = 30;
export const TACH_R_GEAR_PRIMARY_RIM = 24;
export const TACH_R_GEAR_PRIMARY_HUB = 11;
export const TACH_R_GEAR_SECONDARY_OUTER = 24;
export const TACH_R_GEAR_SECONDARY_ROOT = 19.5;
export const TACH_R_GEAR_SECONDARY_RIM = 14;
export const TACH_R_GEAR_SECONDARY_HUB = 6.5;
export const TACH_SECONDARY_CX = TACH_CX + 34;
export const TACH_SECONDARY_CY = TACH_CY - 24;
/** Primary:secondary tooth ratio for reverse mesh. */
export const TACH_GEAR_RATIO = 1.6;
/** Brushed movement plate under the gears. */
export const TACH_MOVEMENT_PLATE_R = 74;
export const TACH_MOVEMENT_GROOVE_RADII = [44, 52, 60, 68, 72] as const;
/** Recessed crest cup (isolates GuillocheCrest from gear spokes). */
export const TACH_CREST_CUP_OUTER_R = 27;
export const TACH_CREST_CUP_MID_R = 24.5;
export const TACH_CREST_CUP_INNER_R = 21.5;

export interface TachTick {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  major: boolean;
  label?: { n: number; x: number; y: number };
}

export interface TachPolarPoint {
  x: number;
  y: number;
}

export type TachBandColor = 'cyan' | 'gold' | 'red';

export interface TachSegment {
  key: string;
  index: number;
  /** Mid progress of this cell (0–1). */
  progressMid: number;
  /** Cell lights when needle progress ≥ this. */
  lightAt: number;
  startDeg: number;
  endDeg: number;
  band: TachBandColor;
  litColor: string;
  path: string;
}

export interface TachKnurlTick {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TachScrew {
  key: string;
  cx: number;
  cy: number;
  r: number;
  /** Precomputed hex seat polygon (screen space) — avoids per-render trig in UI. */
  hexPoints: string;
}

export interface TachSolidGear {
  key: 'primary' | 'secondary';
  cx: number;
  cy: number;
  teeth: number;
  hubR: number;
  spokeCount: number;
  /** Compound evenodd path: tooth body − spoke cutouts − hub bore. */
  bodyPath: string;
}

export interface TachJewel {
  key: string;
  cx: number;
  cy: number;
  r: number;
  tone: 'cyan' | 'red';
}

/** Flat-to-flat hexagon inscribed in radius `r * 0.55` about (cx, cy). */
export function buildHexPoints(cx: number, cy: number, r: number): string {
  const hr = r * 0.55;
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((i / 6) * 360 - 90) * (Math.PI / 180);
    return `${cx + Math.cos(a) * hr},${cy + Math.sin(a) * hr}`;
  }).join(' ');
}

/** Full circle subpath — `ccw` flips winding for evenodd holes. */
export function describeCirclePath(
  cx: number,
  cy: number,
  r: number,
  ccw = false
): string {
  const sweep = ccw ? 0 : 1;
  return [
    `M ${cx - r} ${cy}`,
    `A ${r} ${r} 0 1 ${sweep} ${cx + r} ${cy}`,
    `A ${r} ${r} 0 1 ${sweep} ${cx - r} ${cy}`,
    'Z',
  ].join(' ');
}

/** Tooth tip span as a fraction of one pitch (trapezoid flanks). */
const GEAR_TOOTH_TIP_START = 0.28;
const GEAR_TOOTH_TIP_END = 0.72;
/** Spoke window angular width as a fraction of one spoke pitch. */
const GEAR_SPOKE_WIDTH_FRAC = 0.42;
/** Keep a thin solid lip between spoke cutout and rim / hub bore. */
const GEAR_SPOKE_RIM_INSET = 1.2;
const GEAR_SPOKE_HUB_FLARE = 2.2;

/**
 * Solid spur gear with trapezoid teeth + spoke windows + hub bore (evenodd).
 * WHY: Wireframe rings read as CAD overlay; filled metal + cutouts read as machined movement.
 */
export function buildSolidGearPath(
  cx: number,
  cy: number,
  teeth: number,
  rTip: number,
  rRoot: number,
  rRim: number,
  rHub: number,
  spokeCount: number
): string {
  const pitch = 360 / teeth;
  const toothParts: string[] = [];
  for (let i = 0; i < teeth; i += 1) {
    const base = (i / teeth) * 360;
    const p0 = polar(cx, cy, rRoot, base);
    const p1 = polar(cx, cy, rTip, base + pitch * GEAR_TOOTH_TIP_START);
    const p2 = polar(cx, cy, rTip, base + pitch * GEAR_TOOTH_TIP_END);
    const p3 = polar(cx, cy, rRoot, base + pitch);
    if (i === 0) toothParts.push(`M ${p0.x} ${p0.y}`);
    else toothParts.push(`L ${p0.x} ${p0.y}`);
    toothParts.push(`L ${p1.x} ${p1.y}`, `L ${p2.x} ${p2.y}`, `L ${p3.x} ${p3.y}`);
  }
  toothParts.push('Z');

  // Hub bore + spoke windows: reverse winding so fill-rule=evenodd punches solid metal.
  const holes: string[] = [describeCirclePath(cx, cy, rHub, true)];
  const spokePitch = 360 / spokeCount;
  const spokeWidth = spokePitch * GEAR_SPOKE_WIDTH_FRAC;
  const rSpokeOuter = rRim - GEAR_SPOKE_RIM_INSET;
  const rSpokeInner = rHub + GEAR_SPOKE_HUB_FLARE;
  for (let i = 0; i < spokeCount; i += 1) {
    const mid = (i / spokeCount) * 360 + spokePitch / 2;
    const a0 = mid - spokeWidth / 2;
    const a1 = mid + spokeWidth / 2;
    const o0 = polar(cx, cy, rSpokeOuter, a0);
    const o1 = polar(cx, cy, rSpokeOuter, a1);
    const i1 = polar(cx, cy, rSpokeInner, a1);
    const i0 = polar(cx, cy, rSpokeInner, a0);
    holes.push(
      [
        `M ${o0.x} ${o0.y}`,
        `A ${rSpokeOuter} ${rSpokeOuter} 0 0 1 ${o1.x} ${o1.y}`,
        `L ${i1.x} ${i1.y}`,
        `A ${rSpokeInner} ${rSpokeInner} 0 0 0 ${i0.x} ${i0.y}`,
        'Z',
      ].join(' ')
    );
  }

  return `${toothParts.join(' ')} ${holes.join(' ')}`;
}

export function buildSolidGear(spec: {
  key: 'primary' | 'secondary';
  cx: number;
  cy: number;
  teeth: number;
  rTip: number;
  rRoot: number;
  rRim: number;
  rHub: number;
  spokeCount: number;
}): TachSolidGear {
  return {
    key: spec.key,
    cx: spec.cx,
    cy: spec.cy,
    teeth: spec.teeth,
    hubR: spec.rHub,
    spokeCount: spec.spokeCount,
    bodyPath: buildSolidGearPath(
      spec.cx,
      spec.cy,
      spec.teeth,
      spec.rTip,
      spec.rRoot,
      spec.rRim,
      spec.rHub,
      spec.spokeCount
    ),
  };
}

/**
 * Map load progress (0–1) → UI dial degrees.
 * WHY: Degrees increase so the needle sweeps clockwise 7→12→5 (never through the floor).
 */
export function progressToTachAngleDeg(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return TACH_START_DEG + p * TACH_SWEEP_DEG;
}

/**
 * Needle SVG rotation (CW from up).
 * WHY: UI dial deg 150→390 maps to hard-edge blade pointing at 7→5 through 12.
 */
export function progressToNeedleRotateDeg(progress: number): number {
  return progressToTachAngleDeg(progress) - 270;
}

/** Primary gear CW spin locked to load progress. */
export function progressToPrimaryGearRotateDeg(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return p * 54;
}

/** Secondary gear reverse mesh (opposite × ratio). */
export function progressToSecondaryGearRotateDeg(progress: number): number {
  return -progressToPrimaryGearRotateDeg(progress) * TACH_GEAR_RATIO;
}

export function formatLaunchProgressPercent(progress: number): string {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return `${String(pct).padStart(3, '0')}%`;
}

export function isLaunchRedline(progress: number): boolean {
  return progress >= 0.999;
}

/** Frameless HUD primary line — percent while spinning, redline legend at full. */
export function formatLaunchHudPrimary(progress: number): string {
  return isLaunchRedline(progress) ? 'REDLINE // READY' : formatLaunchProgressPercent(progress);
}

/** Frameless HUD secondary line — ignition telemetry while spinning. */
export function formatLaunchHudSecondary(progress: number): string | null {
  return isLaunchRedline(progress) ? null : 'SYS.IGNITION';
}

export function rpmBand(rpm: number): TachBandColor {
  if (rpm >= TACH_REDLINE_RPM) return 'red';
  if (rpm >= TACH_GOLD_RPM) return 'gold';
  return 'cyan';
}

export function bandLitColor(band: TachBandColor): string {
  if (band === 'red') return TACH_COLOR_RED;
  if (band === 'gold') return TACH_COLOR_GOLD;
  return TACH_COLOR_CYAN;
}

/** Major numeral highlights once the needle has swept past that RPM. */
export function isTachLabelLit(rpm: number, progress: number): boolean {
  return progress * TACH_MAX_RPM >= rpm - 0.001;
}

/**
 * UI dial degrees → screen point.
 * Contract: increasing `deg` walks clockwise through 12 o'clock (never under the dial).
 */
export function polar(cx: number, cy: number, r: number, deg: number): TachPolarPoint {
  // Convert UI-CW degrees (150=7oclock) into classic CCW-from-east math for cos/-sin.
  const mathDeg = 360 - deg;
  const rad = (mathDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

/** SVG arc along increasing UI degrees (clockwise on screen through the crown). */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const sweep = Math.abs(endDeg - startDeg);
  const largeArc = sweep > 180 ? 1 : 0;
  // sweep-flag 1 = clockwise in SVG (y-down), matching increasing UI degrees.
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Annular wedge between two radii (shift-light cell), UI-CW. */
export function describeAnnulusSegment(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number
): string {
  const o0 = polar(cx, cy, rOuter, startDeg);
  const o1 = polar(cx, cy, rOuter, endDeg);
  const i1 = polar(cx, cy, rInner, endDeg);
  const i0 = polar(cx, cy, rInner, startDeg);
  const sweep = Math.abs(endDeg - startDeg);
  const largeArc = sweep > 180 ? 1 : 0;
  return [
    `M ${o0.x} ${o0.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${o1.x} ${o1.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${i0.x} ${i0.y}`,
    'Z',
  ].join(' ');
}

export function buildTachTicks(
  cx = TACH_CX,
  cy = TACH_CY,
  maxRpm = TACH_MAX_RPM
): TachTick[] {
  const ticks: TachTick[] = [];
  for (let i = 0; i <= maxRpm * 2; i += 1) {
    const rpm = i / 2;
    const progress = rpm / maxRpm;
    const deg = progressToTachAngleDeg(progress);
    const major = Number.isInteger(rpm);
    const inner = major ? TACH_R_TICK_INNER_MAJOR : TACH_R_TICK_INNER_MINOR;
    const a = polar(cx, cy, TACH_R_TICK_OUTER, deg);
    const b = polar(cx, cy, inner, deg);
    ticks.push({
      key: `t-${rpm}`,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      major,
      label: major
        ? {
            n: rpm,
            ...polar(cx, cy, TACH_R_LABEL, deg),
          }
        : undefined,
    });
  }
  return ticks;
}

/** Full-circle knurling on the bezel step (CNC tooth texture). */
export function buildKnurlTicks(
  cx = TACH_CX,
  cy = TACH_CY,
  count = TACH_KNURL_COUNT,
  rInner = TACH_R_OUTER + 4.2,
  rOuter = TACH_R_OUTER + 9.2
): TachKnurlTick[] {
  return Array.from({ length: count }, (_, i) => {
    // Full 360° knurl uses UI degrees 0..360 (same polar converter).
    const deg = (i / count) * 360;
    const a = polar(cx, cy, rOuter, deg);
    const b = polar(cx, cy, rInner, deg);
    return { key: `knurl-${i}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  });
}

/**
 * Build 45 shift-light cells with a hairline gap so each block reads as a discrete LED.
 * WHY: Continuous arcs feel like old analog paint; segmented cells read as race HUD.
 */
export function buildTachSegments(
  cx = TACH_CX,
  cy = TACH_CY,
  count = TACH_SEGMENT_COUNT
): TachSegment[] {
  const gapFrac = 0.18;
  const cell = 1 / count;
  return Array.from({ length: count }, (_, index) => {
    const p0 = index * cell;
    const p1 = (index + 1) * cell;
    const gap = cell * gapFrac * 0.5;
    const startDeg = progressToTachAngleDeg(p0 + gap);
    const endDeg = progressToTachAngleDeg(p1 - gap);
    const progressMid = (p0 + p1) / 2;
    const rpmMid = progressMid * TACH_MAX_RPM;
    const band = rpmBand(rpmMid);
    return {
      key: `seg-${index}`,
      index,
      progressMid,
      lightAt: p0,
      startDeg,
      endDeg,
      band,
      litColor: bandLitColor(band),
      path: describeAnnulusSegment(
        cx,
        cy,
        TACH_R_SEGMENT_INNER,
        TACH_R_SEGMENT_OUTER,
        startDeg,
        endDeg
      ),
    };
  });
}

export function isSegmentLit(segment: TachSegment, progress: number): boolean {
  return progress >= segment.lightAt - 1e-6;
}

/** Assert clockwise order: each successive major label's UI angle is greater. */
export function isClockwiseLabelOrder(ticks: TachTick[] = TACH_TICKS): boolean {
  const majors = ticks.filter((t) => t.label != null);
  for (let i = 1; i < majors.length; i += 1) {
    const prev = progressToTachAngleDeg((majors[i - 1]!.label!.n) / TACH_MAX_RPM);
    const next = progressToTachAngleDeg((majors[i]!.label!.n) / TACH_MAX_RPM);
    if (!(next > prev)) return false;
  }
  return true;
}

export const TACH_TICKS = buildTachTicks();
export const TACH_KNURL_TICKS = buildKnurlTicks();
export const TACH_PRIMARY_GEAR = buildSolidGear({
  key: 'primary',
  cx: TACH_CX,
  cy: TACH_CY,
  teeth: 20,
  rTip: TACH_R_GEAR_PRIMARY_OUTER,
  rRoot: TACH_R_GEAR_PRIMARY_ROOT,
  rRim: TACH_R_GEAR_PRIMARY_RIM,
  rHub: TACH_R_GEAR_PRIMARY_HUB,
  spokeCount: 5,
});
export const TACH_SECONDARY_GEAR = buildSolidGear({
  key: 'secondary',
  cx: TACH_SECONDARY_CX,
  cy: TACH_SECONDARY_CY,
  teeth: 12,
  rTip: TACH_R_GEAR_SECONDARY_OUTER,
  rRoot: TACH_R_GEAR_SECONDARY_ROOT,
  rRim: TACH_R_GEAR_SECONDARY_RIM,
  rHub: TACH_R_GEAR_SECONDARY_HUB,
  spokeCount: 4,
});
export const TACH_SEGMENTS = buildTachSegments();
export const TACH_REDLINE_START_DEG = progressToTachAngleDeg(TACH_REDLINE_RPM / TACH_MAX_RPM);
export const TACH_REDLINE_END_DEG = progressToTachAngleDeg(1);

/**
 * Slim titanium / rhodium bridge arms (~8px chord; fill + separate highlight edge).
 * WHY: Wide champagne slabs stole focus from GuillocheCrest; slender cold-steel bridges read as milled movement without yellow mass.
 */
export const TACH_BRIDGE_PATHS = [
  `M ${TACH_CX - 54} ${TACH_CY - 12} L ${TACH_CX - 16} ${TACH_CY - 30} L ${TACH_CX + 18} ${TACH_CY - 26} L ${TACH_CX + 52} ${TACH_CY - 8} L ${TACH_CX + 50} ${TACH_CY} L ${TACH_CX + 16} ${TACH_CY - 17} L ${TACH_CX - 14} ${TACH_CY - 20} L ${TACH_CX - 50} ${TACH_CY - 4} Z`,
  `M ${TACH_CX - 46} ${TACH_CY + 14} L ${TACH_CX - 10} ${TACH_CY + 37} L ${TACH_CX + 26} ${TACH_CY + 32} L ${TACH_CX + 44} ${TACH_CY + 14} L ${TACH_CX + 36} ${TACH_CY + 22} L ${TACH_CX - 4} ${TACH_CY + 29} L ${TACH_CX - 38} ${TACH_CY + 6} Z`,
] as const;

/** Upper chamfer highlight edges riding the slim bridge crowns. */
export const TACH_BRIDGE_HIGHLIGHT_PATHS = [
  `M ${TACH_CX - 52} ${TACH_CY - 11} L ${TACH_CX - 16} ${TACH_CY - 28} L ${TACH_CX + 16} ${TACH_CY - 24} L ${TACH_CX + 50} ${TACH_CY - 7}`,
  `M ${TACH_CX - 42} ${TACH_CY + 15} L ${TACH_CX - 8} ${TACH_CY + 34} L ${TACH_CX + 24} ${TACH_CY + 30}`,
] as const;

/** Hex screw / bearing seats on bridge corners. */
export const TACH_SCREWS: TachScrew[] = (
  [
    { key: 'sc-1', cx: TACH_CX - 44, cy: TACH_CY - 10, r: 3.2 },
    { key: 'sc-2', cx: TACH_CX + 40, cy: TACH_CY - 8, r: 3.2 },
    { key: 'sc-3', cx: TACH_CX - 28, cy: TACH_CY + 22, r: 2.8 },
    { key: 'sc-4', cx: TACH_CX + 30, cy: TACH_CY + 20, r: 2.8 },
    { key: 'sc-5', cx: TACH_CX + 8, cy: TACH_CY - 26, r: 2.6 },
    { key: 'sc-6', cx: TACH_CX - 6, cy: TACH_CY + 34, r: 2.6 },
  ] as const
).map((s) => ({ ...s, hexPoints: buildHexPoints(s.cx, s.cy, s.r) }));

/** Micro jewel bearings beside bridge pivots. */
export const TACH_JEWELS: TachJewel[] = [
  { key: 'jw-1', cx: TACH_CX - 36, cy: TACH_CY - 18, r: 1.45, tone: 'cyan' },
  { key: 'jw-2', cx: TACH_CX + 34, cy: TACH_CY - 16, r: 1.45, tone: 'red' },
  { key: 'jw-3', cx: TACH_CX - 18, cy: TACH_CY + 30, r: 1.25, tone: 'cyan' },
  { key: 'jw-4', cx: TACH_CX + 22, cy: TACH_CY + 28, r: 1.25, tone: 'red' },
];

/** Sharp sapphire specular slash (not a soft fog arc). */
export const TACH_SAPPHIRE_SLASH = {
  x1: TACH_CX - 78,
  y1: TACH_CY - 72,
  x2: TACH_CX + 18,
  y2: TACH_CY - 98,
} as const;

/** Inner bezel refraction hairline (UI-CW upper quarter). */
export const TACH_REFRACTION_PATH = describeArc(
  TACH_CX,
  TACH_CY,
  TACH_R_OUTER - 3,
  200,
  340
);

/** Full outer tick rail path (0 → 9), clockwise. */
export const TACH_OUTER_RAIL_PATH = describeArc(
  TACH_CX,
  TACH_CY,
  TACH_R_TICK_OUTER,
  TACH_START_DEG,
  TACH_END_DEG
);

/** Redline accent arc path (7.5 → 9). */
export const TACH_REDLINE_ARC_PATH = describeArc(
  TACH_CX,
  TACH_CY,
  TACH_R_TICK_OUTER - 1,
  TACH_REDLINE_START_DEG,
  TACH_REDLINE_END_DEG
);

/** CD-groove radii on the bezel step. */
export const TACH_CD_GROOVE_RADII = [
  TACH_R_OUTER + 2,
  TACH_R_OUTER + 3.4,
  TACH_R_OUTER + 5.6,
  TACH_R_OUTER + 7.2,
] as const;

export function isZhLaunchLocale(language: string | undefined): boolean {
  if (!language) return true;
  return language.toLowerCase().startsWith('zh');
}
