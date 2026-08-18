import { useEffect, useState } from 'react';
import {
  hasUnseenSpecBadges,
  loadSeenBadgeIds,
  markBadgesAsSeen,
  resolveGrandfatheredSeen,
  subscribeSpecBadgeSeen,
} from '../services/specBadgeSeenService';
import {
  loadTrainingFootprint,
  subscribeTrainingFootprint,
} from '../services/trainingFootprintService';

function readHasUnseenSpecBadge(): boolean {
  return hasUnseenSpecBadges(loadTrainingFootprint().unlockedBadgeIds);
}

/**
 * Bottom-nav unread chrome only. Does not expose the footprint blob to presentational tabs.
 */
export function useHistorySpecBadgeNotification(): { hasUnseenSpecBadge: boolean } {
  const [hasUnseenSpecBadge, setHasUnseenSpecBadge] = useState(readHasUnseenSpecBadge);

  useEffect(() => {
    const refresh = () => {
      const unlockedIds = loadTrainingFootprint().unlockedBadgeIds;
      if (loadSeenBadgeIds() === null) {
        // WHY: Grandfather returning users after mount, never during render.
        markBadgesAsSeen(resolveGrandfatheredSeen(unlockedIds));
      }
      setHasUnseenSpecBadge(hasUnseenSpecBadges(unlockedIds));
    };
    const unsubscribeFootprint = subscribeTrainingFootprint(refresh);
    const unsubscribeSeen = subscribeSpecBadgeSeen(refresh);
    refresh();
    return () => {
      unsubscribeFootprint();
      unsubscribeSeen();
    };
  }, []);

  return { hasUnseenSpecBadge };
}
