import { useEffect, useRef } from 'react';
import { diffNewlyUnlocked } from '../logic/core/specBadgeUnlockDiff';
import {
  loadTrainingFootprint,
  subscribeTrainingFootprint,
} from '../services/trainingFootprintService';
import { useBadgeToastStore } from '../stores/badgeToastStore';

/**
 * Mount in AppShell — watches footprint changes and pushes newly unlocked badge IDs
 * into the toast queue. Initialises `prevRef` at mount so existing badges stay quiet.
 */
export function useSpecBadgeUnlockToast(): void {
  const push = useBadgeToastStore((s) => s.push);
  const prevRef = useRef<string[]>(loadTrainingFootprint().unlockedBadgeIds);

  useEffect(() => {
    const check = () => {
      const current = loadTrainingFootprint().unlockedBadgeIds;
      const newIds = diffNewlyUnlocked(prevRef.current, current);
      newIds.forEach(push);
      prevRef.current = current;
    };
    const unsub = subscribeTrainingFootprint(check);
    return unsub;
  }, [push]);
}
