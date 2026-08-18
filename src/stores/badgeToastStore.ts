import { create } from 'zustand';

export interface BadgeToastEntry {
  badgeId: string;
  queuedAt: number;
}

interface BadgeToastState {
  queue: BadgeToastEntry[];
  push: (badgeId: string) => void;
  dismiss: () => void;
}

export const useBadgeToastStore = create<BadgeToastState>((set) => ({
  queue: [],
  push: (badgeId) =>
    set((s) => ({
      queue: [...s.queue, { badgeId, queuedAt: Date.now() }],
    })),
  dismiss: () => set((s) => ({ queue: s.queue.slice(1) })),
}));
