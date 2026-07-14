/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSomatotypeLabSnapshot } from '../../logic/core/somatotypeLab';
import type { HapticPreset } from '../../services/hapticService';
import {
  SOMATOTYPE_ANALYSIS_MS,
  SOMATOTYPE_ANALYSIS_REDUCED_MS,
  SOMATOTYPE_SCAN_HAPTIC_COUNT,
  SOMATOTYPE_SCAN_HAPTIC_INTERVAL_MS,
  useSomatotypeLabRitual,
  type UseSomatotypeLabRitualResult,
} from '../useSomatotypeLabRitual';

const hapticTrigger = vi.fn<(preset: HapticPreset) => Promise<void>>(async () => undefined);
const prefersReducedMotionMock = vi.fn(() => false);

vi.mock('../../services/hapticService', () => ({
  hapticService: {
    trigger: (preset: HapticPreset) => hapticTrigger(preset),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'tools.somatotypeLab.ritual.scanning': 'SCANNING',
        'tools.somatotypeLab.ritual.overlayAria': 'ARIA',
        'tools.somatotypeLab.ritual.lines.bone': 'BONE',
        'tools.somatotypeLab.ritual.lines.somatotype': 'SOMA',
        'tools.somatotypeLab.ritual.lines.ceiling': 'CEILING',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('../../lib/motionPreference', () => ({
  prefersReducedMotion: () => prefersReducedMotionMock(),
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function countPreset(preset: HapticPreset): number {
  return hapticTrigger.mock.calls.filter((call) => call[0] === preset).length;
}

function renderRitualHarness(
  canAnalyze: boolean,
  snapshot: ReturnType<typeof buildSomatotypeLabSnapshot>
): {
  getCurrent: () => UseSomatotypeLabRitualResult | null;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: UseSomatotypeLabRitualResult | null = null;

  function Harness() {
    latest = useSomatotypeLabRitual(canAnalyze, snapshot);
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    getCurrent: () => latest,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function validSnap() {
  return buildSomatotypeLabSnapshot({
    heightCm: 180,
    weightKg: 80,
    bodyFatPct: 18,
    wristCm: 17,
    flexedArmGirthCm: 32,
  });
}

describe('useSomatotypeLabRitual', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    hapticTrigger.mockClear();
    prefersReducedMotionMock.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('moves idle → analyzing → completed over 2s and freezes the snapshot', () => {
    const snap = validSnap();
    expect(snap).not.toBeNull();

    const harness = renderRitualHarness(true, snap);
    expect(harness.getCurrent()!.analysisState).toBe('idle');
    expect(harness.getCurrent()!.modalOpen).toBe(false);

    act(() => {
      harness.getCurrent()!.runAnalysis();
    });
    expect(harness.getCurrent()!.analysisState).toBe('analyzing');
    expect(harness.getCurrent()!.isAnalyzing).toBe(true);
    expect(harness.getCurrent()!.reportSnapshot).toEqual(snap);

    act(() => {
      vi.advanceTimersByTime(SOMATOTYPE_ANALYSIS_MS);
    });
    expect(harness.getCurrent()!.analysisState).toBe('completed');
    expect(harness.getCurrent()!.modalOpen).toBe(true);
    expect(harness.getCurrent()!.reportSessionId).toBe(1);

    act(() => {
      harness.getCurrent()!.closeReport();
    });
    expect(harness.getCurrent()!.analysisState).toBe('idle');
    expect(harness.getCurrent()!.modalOpen).toBe(false);
    expect(harness.getCurrent()!.reportSnapshot).toBeNull();

    act(() => {
      harness.getCurrent()!.runAnalysis();
    });
    act(() => {
      vi.advanceTimersByTime(SOMATOTYPE_ANALYSIS_MS);
    });
    expect(harness.getCurrent()!.reportSessionId).toBe(2);
    harness.unmount();
  });

  it('fires ack → 4× selection scan pulses → success on the 2s ritual timeline', () => {
    const snap = validSnap();
    expect(snap).not.toBeNull();

    const harness = renderRitualHarness(true, snap);

    act(() => {
      harness.getCurrent()!.runAnalysis();
    });

    expect(hapticTrigger).toHaveBeenNthCalledWith(1, 'ack');
    expect(hapticTrigger).toHaveBeenNthCalledWith(2, 'selection');
    expect(countPreset('selection')).toBe(1);

    for (let i = 1; i < SOMATOTYPE_SCAN_HAPTIC_COUNT; i += 1) {
      act(() => {
        vi.advanceTimersByTime(SOMATOTYPE_SCAN_HAPTIC_INTERVAL_MS);
      });
      expect(countPreset('selection')).toBe(i + 1);
    }

    const remaining =
      SOMATOTYPE_ANALYSIS_MS - (SOMATOTYPE_SCAN_HAPTIC_COUNT - 1) * SOMATOTYPE_SCAN_HAPTIC_INTERVAL_MS;
    act(() => {
      vi.advanceTimersByTime(remaining);
    });

    expect(countPreset('ack')).toBe(1);
    expect(countPreset('selection')).toBe(SOMATOTYPE_SCAN_HAPTIC_COUNT);
    expect(countPreset('success')).toBe(1);
    expect(harness.getCurrent()!.modalOpen).toBe(true);

    harness.unmount();
  });

  it('skips scan selection pulses under reduced motion but still completes with ack → success', () => {
    prefersReducedMotionMock.mockReturnValue(true);
    const snap = validSnap();
    expect(snap).not.toBeNull();

    const harness = renderRitualHarness(true, snap);
    act(() => {
      harness.getCurrent()!.runAnalysis();
    });

    expect(countPreset('ack')).toBe(1);
    expect(countPreset('selection')).toBe(0);

    act(() => {
      vi.advanceTimersByTime(SOMATOTYPE_ANALYSIS_REDUCED_MS);
    });

    expect(countPreset('selection')).toBe(0);
    expect(countPreset('success')).toBe(1);
    expect(harness.getCurrent()!.modalOpen).toBe(true);
    harness.unmount();
  });

  it('cancels pending scan/success haptics when unmounted mid-analysis', () => {
    const snap = validSnap();
    expect(snap).not.toBeNull();

    const harness = renderRitualHarness(true, snap);
    act(() => {
      harness.getCurrent()!.runAnalysis();
    });
    expect(countPreset('ack')).toBe(1);
    expect(countPreset('selection')).toBe(1);

    harness.unmount();

    act(() => {
      vi.advanceTimersByTime(SOMATOTYPE_ANALYSIS_MS);
    });

    expect(countPreset('selection')).toBe(1);
    expect(countPreset('success')).toBe(0);
  });

  it('ignores re-entrant runAnalysis while busy so haptics do not double-fire', () => {
    const snap = validSnap();
    expect(snap).not.toBeNull();

    const harness = renderRitualHarness(true, snap);
    act(() => {
      harness.getCurrent()!.runAnalysis();
      harness.getCurrent()!.runAnalysis();
    });

    expect(countPreset('ack')).toBe(1);
    expect(countPreset('selection')).toBe(1);

    act(() => {
      vi.advanceTimersByTime(SOMATOTYPE_ANALYSIS_MS);
    });
    expect(countPreset('ack')).toBe(1);
    expect(countPreset('selection')).toBe(SOMATOTYPE_SCAN_HAPTIC_COUNT);
    expect(countPreset('success')).toBe(1);
    harness.unmount();
  });

  it('ignores runAnalysis when snapshot is not ready', () => {
    const harness = renderRitualHarness(false, null);
    act(() => {
      harness.getCurrent()!.runAnalysis();
    });
    expect(harness.getCurrent()!.analysisState).toBe('idle');
    expect(hapticTrigger).not.toHaveBeenCalled();
    harness.unmount();
  });
});
