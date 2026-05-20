import { MONETIZATION_CONFIG } from '../../config/monetization';

export interface RankPromotionEvent {
  previousRank: number;
  currentRank: number;
  delta: number;
  milestone: number | null;
}

const MILESTONE_ORDER: number[] = [...MONETIZATION_CONFIG.leaderboardPromotionMilestones].sort(
  (a, b) => a - b
);

export function detectTierMilestone(previousRank: number, currentRank: number): number | null {
  for (const milestone of MILESTONE_ORDER) {
    if (previousRank > milestone && currentRank <= milestone) return milestone;
  }
  return null;
}

export function detectPromotion(
  previousRank: number | null,
  currentRank: number | null
): RankPromotionEvent | null {
  if (!previousRank || !currentRank) return null;
  if (currentRank >= previousRank) return null;
  return {
    previousRank,
    currentRank,
    delta: previousRank - currentRank,
    milestone: detectTierMilestone(previousRank, currentRank),
  };
}
