import { useEffect, useMemo, useState } from 'react';
import { deriveFootprintDashboard, type TrainingFootprintState } from '../logic/core/trainingFootprint';
import {
  deriveUnlockedBadges,
  type TrainingFootprintPanelView,
} from '../logic/core/trainingFootprintBadges';
import { snapshotSpecBadgeDeriveInput } from '../services/specBadgeDeriveSnapshot';
import {
  loadTrainingFootprint,
  subscribeTrainingFootprint,
} from '../services/trainingFootprintService';
import { useHistoryStore } from '../stores/historyStore';
import { useScoreStore } from '../stores/scoreStore';

export type { TrainingFootprintPanelView };

export function useTrainingFootprint(): TrainingFootprintPanelView {
  const [state, setState] = useState<TrainingFootprintState>(loadTrainingFootprint);
  const scores = useScoreStore((s) => s.scores);
  const historyLength = useHistoryStore((s) => s.records.length);

  useEffect(() => subscribeTrainingFootprint(() => setState(loadTrainingFootprint())), []);

  const dashboard = useMemo(() => deriveFootprintDashboard(state), [state]);
  const badges = useMemo(
    () => deriveUnlockedBadges(state, snapshotSpecBadgeDeriveInput(scores, historyLength)),
    [state, scores, historyLength]
  );

  return { ...dashboard, badges };
}
