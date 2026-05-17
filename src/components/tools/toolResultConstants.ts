import type { PlateDisplayPick } from '../../types/trainingToolsDisplay';

/** Training load percentages shown in 1RM result HUD (display-only; not persisted). */
export const TRAINING_LOAD_PERCENTS = [95, 90, 85, 80, 75, 70, 65, 60] as const;

/**
 * Representative strength-axis score for tool modal neon — not the user's radar score.
 * WHY: 1RM kg must not be passed into band resolution; tools need stable strength-colored glow.
 */
export const TOOL_ONE_RM_AURA_STRENGTH_SCORE = 85;

export function buildTrainingPercentRows(oneRmKg: number): { percent: number; weightKg: number }[] {
  if (!Number.isFinite(oneRmKg) || oneRmKg <= 0) return [];
  return TRAINING_LOAD_PERCENTS.map((percent) => ({
    percent,
    weightKg: Math.round(oneRmKg * (percent / 100) * 10) / 10,
  }));
}

export function formatToolWeight(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export function expandPlateBlocks(picks: PlateDisplayPick[]): number[] {
  const blocks: number[] = [];
  for (const pick of picks) {
    for (let i = 0; i < pick.count; i += 1) {
      blocks.push(pick.plateValue);
    }
  }
  return blocks;
}
