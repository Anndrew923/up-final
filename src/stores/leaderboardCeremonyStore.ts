import { create } from 'zustand';
import type { RankPromotionEvent } from '../logic/core/leaderboardProgress';

interface LeaderboardCeremonyStore {
  pendingPromotion: RankPromotionEvent | null;
  queuePromotion(event: RankPromotionEvent): void;
  consumePromotion(): RankPromotionEvent | null;
  clearPromotion(): void;
}

export const useLeaderboardCeremonyStore = create<LeaderboardCeremonyStore>((set, get) => ({
  pendingPromotion: null,
  queuePromotion(event) {
    set({ pendingPromotion: event });
  },
  consumePromotion() {
    const current = get().pendingPromotion;
    if (!current) return null;
    set({ pendingPromotion: null });
    return current;
  },
  clearPromotion() {
    set({ pendingPromotion: null });
  },
}));

