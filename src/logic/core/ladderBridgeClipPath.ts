/**
 * Ladder floating-rank bridge clip-path (objectBoundingBox 0–1).
 *
 * WHY: Keep arch width/depth derived from `bottomChrome` px constants so geometry
 * and the SVG path cannot drift. clip-path (not mask) also punches hit-testing
 * so the DYNO hex remains tappable through the arch.
 */

export interface LadderBridgeClipPathInput {
  /** Arch cutout width as a fraction of shell width (0–1). */
  archWidthFrac: number;
  /** Arch cutout depth as a fraction of shell height (0–1). */
  archDepthFrac: number;
}

/**
 * Build a continuous bridge path with a center-bottom arch.
 * Corners use light quadratic rounds; arch uses cubic easing into the apex.
 */
export function buildLadderBridgeClipPathD(input: LadderBridgeClipPathInput): string {
  const half = Math.min(Math.max(input.archWidthFrac, 0.08), 0.45) / 2;
  const depth = Math.min(Math.max(input.archDepthFrac, 0.12), 0.55);
  const left = 0.5 - half;
  const right = 0.5 + half;
  const apexY = 1 - depth;
  // Side control x pulls the cubic toward center for a rounded arch foot.
  const leftCtrl = left + half * 0.35;
  const rightCtrl = right - half * 0.35;

  return [
    'M0.03,0',
    'H0.97',
    'Q1,0 1,0.1',
    'V0.88',
    'Q1,1 0.97,1',
    `H${right.toFixed(4)}`,
    `C${rightCtrl.toFixed(4)},1 ${rightCtrl.toFixed(4)},${apexY.toFixed(4)} 0.5,${apexY.toFixed(4)}`,
    `C${leftCtrl.toFixed(4)},${apexY.toFixed(4)} ${leftCtrl.toFixed(4)},1 ${left.toFixed(4)},1`,
    'H0.03',
    'Q0,1 0,0.88',
    'V0.1',
    'Q0,0 0.03,0',
    'Z',
  ].join(' ');
}
