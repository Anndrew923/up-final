/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSomatotypeLabSnapshot } from '../../logic/core/somatotypeLab';
import {
  SOMATOTYPE_ANALYSIS_MS,
  useSomatotypeLabRitual,
  type UseSomatotypeLabRitualResult,
} from '../useSomatotypeLabRitual';

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
  prefersReducedMotion: () => false,
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

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

describe('useSomatotypeLabRitual', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('moves idle → analyzing → completed over 2s and freezes the snapshot', () => {
    const snap = buildSomatotypeLabSnapshot({
      heightCm: 180,
      weightKg: 80,
      bodyFatPct: 18,
      wristCm: 17,
      flexedArmGirthCm: 32,
    });
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

  it('ignores runAnalysis when snapshot is not ready', () => {
    const harness = renderRitualHarness(false, null);
    act(() => {
      harness.getCurrent()!.runAnalysis();
    });
    expect(harness.getCurrent()!.analysisState).toBe('idle');
    harness.unmount();
  });
});
