import { beforeEach, describe, expect, it, vi } from 'vitest';

const recordTrainingFootprint = vi.hoisted(() => vi.fn());
const loadHistory = vi.hoisted(() => vi.fn(() => []));
const saveScores = vi.hoisted(() => vi.fn());
const loadScores = vi.hoisted(() => vi.fn(() => ({})));
const saveWidgetSnapshot = vi.hoisted(() => vi.fn());

vi.mock('../../services/trainingFootprintService', () => ({
  recordTrainingFootprint,
}));

vi.mock('../../services/localStorageService', () => ({
  loadHistory,
  loadScores,
  saveScores,
}));

vi.mock('../../services/widgetSnapshotService', () => ({
  buildWidgetSnapshot: () => ({}),
  saveWidgetSnapshot,
}));

describe('scoreStore footprint instrumentation', () => {
  beforeEach(() => {
    recordTrainingFootprint.mockReset();
    loadHistory.mockReset();
    loadHistory.mockReturnValue([]);
    saveScores.mockReset();
    loadScores.mockReturnValue({});
    saveWidgetSnapshot.mockReset();
    vi.resetModules();
  });

  it('records L2 on first setScore and L3 when beating the live mark', async () => {
    const { useScoreStore } = await import('../scoreStore');
    useScoreStore.setState({ scores: {}, overallScore: 0 });

    useScoreStore.getState().setScore('strength', 80);
    expect(recordTrainingFootprint).toHaveBeenCalledWith(
      2,
      expect.any(Date),
      expect.objectContaining({ historyLength: 0 })
    );

    recordTrainingFootprint.mockClear();
    useScoreStore.getState().setScore('strength', 91);
    expect(recordTrainingFootprint).toHaveBeenCalledWith(
      3,
      expect.any(Date),
      expect.objectContaining({
        scores: expect.objectContaining({ strength: 91 }),
        historyLength: 0,
      })
    );
  });

  it('does not record footprint on bulk setScores restore', async () => {
    const { useScoreStore } = await import('../scoreStore');
    useScoreStore.getState().setScores({ strength: 100, cardio: 90 });
    expect(recordTrainingFootprint).not.toHaveBeenCalled();
  });
});
