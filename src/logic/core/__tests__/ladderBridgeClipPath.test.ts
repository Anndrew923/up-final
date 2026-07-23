import { describe, expect, it } from 'vitest';
import {
  LADDER_BRIDGE_ARCH_DEPTH_PX,
  LADDER_BRIDGE_ARCH_WIDTH_PX,
  LADDER_BRIDGE_REF_WIDTH_PX,
  LADDER_FLOATING_RANK_BAR_PX,
} from '../../../constants/bottomChrome';
import { buildLadderBridgeClipPathD } from '../ladderBridgeClipPath';

describe('buildLadderBridgeClipPathD', () => {
  it('places arch apex from depth fraction at x=0.5', () => {
    const archWidthFrac = LADDER_BRIDGE_ARCH_WIDTH_PX / LADDER_BRIDGE_REF_WIDTH_PX;
    const archDepthFrac = LADDER_BRIDGE_ARCH_DEPTH_PX / LADDER_FLOATING_RANK_BAR_PX;
    const d = buildLadderBridgeClipPathD({ archWidthFrac, archDepthFrac });
    const apexY = (1 - archDepthFrac).toFixed(4);

    expect(d).toContain(`0.5,${apexY}`);
    expect(d.startsWith('M0.03,0')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('moves arch feet outward when width fraction increases', () => {
    const narrow = buildLadderBridgeClipPathD({ archWidthFrac: 0.16, archDepthFrac: 0.3 });
    const wide = buildLadderBridgeClipPathD({ archWidthFrac: 0.3, archDepthFrac: 0.3 });
    expect(narrow).toContain('H0.5800');
    expect(wide).toContain('H0.6500');
  });

  it('clamps extreme fractions to keep a usable arch', () => {
    const d = buildLadderBridgeClipPathD({ archWidthFrac: 0.99, archDepthFrac: 0.99 });
    expect(d).toContain('H0.7250'); // max half = 0.225 → right foot 0.725
    expect(d).toContain('0.5,0.4500'); // max depth 0.55 → apex 0.45
  });
});
