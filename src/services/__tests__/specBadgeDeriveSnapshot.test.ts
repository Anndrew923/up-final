import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScoreMap } from '../../types/scoring';
import type { SomatotypeLabInputsPersisted } from '../../types/somatotypeLabInputs';

const persistUnlockedBadgeUnion = vi.hoisted(() => vi.fn());
const loadCardioInputs = vi.hoisted(() => vi.fn(() => null));
const loadPowerInputs = vi.hoisted(() => vi.fn(() => null));
const loadSomatotypeLabInputs = vi.hoisted(() =>
  vi.fn((): SomatotypeLabInputsPersisted | null => null)
);
const loadScores = vi.hoisted(() => vi.fn(() => ({})));
const loadHistory = vi.hoisted(() => vi.fn(() => []));

vi.mock('../trainingFootprintService', () => ({
  persistUnlockedBadgeUnion,
}));

vi.mock('../localStorageService', () => ({
  loadCardioInputs,
  loadPowerInputs,
  loadSomatotypeLabInputs,
  loadScores,
  loadHistory,
}));

describe('specBadgeDeriveSnapshot', () => {
  beforeEach(() => {
    persistUnlockedBadgeUnion.mockClear();
    loadCardioInputs.mockReturnValue(null);
    loadPowerInputs.mockReturnValue(null);
    loadSomatotypeLabInputs.mockReturnValue(null);
    loadScores.mockReturnValue({});
    loadHistory.mockReturnValue([]);
  });

  it('marks somatotypeChartComplete only when the lab draft is Heath–Carter computable', async () => {
    const { snapshotSpecBadgeDeriveInput } = await import('../specBadgeDeriveSnapshot');
    const empty = snapshotSpecBadgeDeriveInput({}, 0);
    expect(empty.somatotypeChartComplete).toBe(false);

    loadSomatotypeLabInputs.mockReturnValue({
      heightCm: 180,
      weightKg: 80,
      bodyFatPct: 18,
      wristCm: 17,
      flexedArmGirthCm: 38,
    });
    const complete = snapshotSpecBadgeDeriveInput({}, 0);
    expect(complete.somatotypeChartComplete).toBe(true);
  });

  it('stamps the union from device storage without a heatmap write', async () => {
    const { persistSpecBadgeUnionFromDevice } = await import('../specBadgeDeriveSnapshot');
    const scores: ScoreMap = { strength: 10 };
    persistSpecBadgeUnionFromDevice(scores, 2);
    expect(persistUnlockedBadgeUnion).toHaveBeenCalledWith(
      expect.objectContaining({ scores, historyLength: 2, somatotypeChartComplete: false })
    );
  });
});
