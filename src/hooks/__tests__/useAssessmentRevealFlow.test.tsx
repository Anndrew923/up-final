/* @vitest-environment jsdom */
import { act, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useAssessmentRevealFlow,
  type UseAssessmentRevealFlowResult,
} from '../useAssessmentRevealFlow';

const triggerImpact = vi.fn();
const triggerBreakthroughCelebration = vi.fn();
const animateTo = vi.fn().mockResolvedValue(undefined);
const cancelAnimation = vi.fn();

vi.mock('../useDopamineFeedback', () => ({
  useDopamineFeedback: () => ({
    triggerImpact,
    triggerBreakthroughCelebration,
    triggerRankUpCombo: vi.fn(),
  }),
}));

vi.mock('../useAnimatedScore', () => ({
  useAnimatedScore: () => ({
    displayValue: 92,
    isAnimating: false,
    setInstant: vi.fn(),
    animateTo,
    cancel: cancelAnimation,
  }),
}));

vi.mock('../useAssessmentCeremony', () => ({
  useAssessmentCeremony: () => ({
    isActive: false,
    statusLine: '',
    scanningLabel: 'Scanning…',
    overlayAriaLabel: 'Overlay',
    wrapCalculate: async (run: () => void) => {
      run();
    },
    cancel: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key.startsWith('scoreMeaning.bands.gripStrength.')) {
        return key.endsWith('.title') ? 'Elite grip' : 'Strong hold';
      }
      if (key.startsWith('grip.ranks.')) return 'Sport elite';
      if (key.startsWith('assessment.auras.')) return 'Shimmer';
      return key;
    },
  }),
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function mountRevealHarness(options: { hasError?: () => boolean; compute?: () => void }): {
  getApi: () => UseAssessmentRevealFlowResult | null;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let api: UseAssessmentRevealFlowResult | null = null;

  function Harness() {
    const [score, setScore] = useState<number | null>(null);
    const flow = useAssessmentRevealFlow({
      pool: 'grip',
      metric: 'gripStrength',
      scoreDecimals: 1,
      getScore: () => score,
      hasError: options.hasError ?? (() => false),
      compute:
        options.compute ??
        (() => {
          setScore(92);
        }),
    });

    useEffect(() => {
      api = flow;
    }, [flow]);

    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    getApi: () => api,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useAssessmentRevealFlow', () => {
  beforeEach(() => {
    triggerImpact.mockReset();
    triggerBreakthroughCelebration.mockReset();
    animateTo.mockClear();
    cancelAnimation.mockClear();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads score after compute via live ref (not stale closure)', async () => {
    const { getApi, unmount } = mountRevealHarness({});

    await act(async () => {
      await getApi()!.revealCalculate();
    });

    const api = getApi()!;
    expect(animateTo).toHaveBeenCalledWith(92, null);
    expect(api.modalOpen).toBe(true);
    expect(api.modalPayload?.score).toBe(92);
    expect(triggerImpact).toHaveBeenCalledWith('medium');
    expect(triggerBreakthroughCelebration).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('skips modal when hasError after compute', async () => {
    const { getApi, unmount } = mountRevealHarness({
      hasError: () => true,
      compute: vi.fn(),
    });

    await act(async () => {
      await getApi()!.revealCalculate();
    });

    expect(getApi()!.modalOpen).toBe(false);
    expect(animateTo).not.toHaveBeenCalled();
    unmount();
  });
});
