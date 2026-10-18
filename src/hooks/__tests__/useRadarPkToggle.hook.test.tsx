/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRadarPkToggle } from '../useRadarPkToggle';
import type { RadarChartPoint } from '../../types/radarDisplay';
import {
  resolveRadarPkCompareExitMs,
  resolveRadarPkScanMs,
} from '../../logic/core/radarPkClashMotion';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const cmpPoints: RadarChartPoint[] = [
  { key: 'strength', label: 'strength', value: 50 },
];

function Probe({
  open,
  targetUid,
  isSelf,
  canCompare,
  onReady,
}: {
  open: boolean;
  targetUid: string;
  isSelf: boolean;
  canCompare: boolean;
  onReady: (api: ReturnType<typeof useRadarPkToggle>) => void;
}) {
  const api = useRadarPkToggle({
    open,
    targetUid,
    isSelf,
    canCompare,
    comparisonPoints: cmpPoints,
  });
  onReady(api);
  return null;
}

describe('useRadarPkToggle', () => {
  let container: HTMLDivElement;
  let root: Root;
  let latest: ReturnType<typeof useRadarPkToggle> | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    latest = null;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function mount(props: {
    open: boolean;
    targetUid: string;
    isSelf: boolean;
    canCompare: boolean;
  }) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <Probe
          {...props}
          onReady={(api) => {
            latest = api;
          }}
        />
      );
    });
  }

  function advanceToClashed() {
    act(() => {
      latest?.togglePk();
    });
    expect(latest?.pkPhase).toBe('scanning');
    act(() => {
      vi.advanceTimersByTime(resolveRadarPkScanMs(false));
    });
    expect(latest?.pkPhase).toBe('clashed');
  }

  it('defaults to ritual admiration without comparison points', () => {
    mount({ open: true, targetUid: 'u2', isSelf: false, canCompare: true });
    expect(latest?.pkPhase).toBe('idle');
    expect(latest?.presentation).toBe('ritual');
    expect(latest?.pkActive).toBe(false);
    expect(latest?.pkLayerActive).toBe(false);
    expect(latest?.activeComparisonPoints).toBeUndefined();
    expect(latest?.showPkToggle).toBe(true);
  });

  it('enters scanning then clashed with comparison points', () => {
    mount({ open: true, targetUid: 'u2', isSelf: false, canCompare: true });
    act(() => {
      latest?.togglePk();
    });
    expect(latest?.pkPhase).toBe('scanning');
    expect(latest?.isScanning).toBe(true);
    expect(latest?.clashReady).toBe(false);
    expect(latest?.pkActive).toBe(true);
    expect(latest?.pkLayerActive).toBe(true);
    expect(latest?.presentation).toBe('quiet');
    expect(latest?.compareMotion).toBeNull();
    expect(latest?.activeComparisonPoints).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(resolveRadarPkScanMs(false));
    });
    expect(latest?.pkPhase).toBe('clashed');
    expect(latest?.isScanning).toBe(false);
    expect(latest?.clashReady).toBe(true);
    expect(latest?.compareMotion).toBe('enter');
    expect(latest?.activeComparisonPoints).toEqual(cmpPoints);
  });

  it('exits from clashed with fade hold and skips scanning', () => {
    mount({ open: true, targetUid: 'u2', isSelf: false, canCompare: true });
    advanceToClashed();

    act(() => {
      latest?.togglePk();
    });
    expect(latest?.pkPhase).toBe('idle');
    expect(latest?.pkActive).toBe(false);
    expect(latest?.clashReady).toBe(true);
    expect(latest?.pkLayerActive).toBe(true);
    expect(latest?.compareMotion).toBe('exit');
    expect(latest?.activeComparisonPoints).toEqual(cmpPoints);

    act(() => {
      vi.advanceTimersByTime(resolveRadarPkCompareExitMs(false));
    });
    expect(latest?.pkLayerActive).toBe(false);
    expect(latest?.presentation).toBe('ritual');
    expect(latest?.activeComparisonPoints).toBeUndefined();
    expect(latest?.compareMotion).toBeNull();
  });

  it('skips scan and exit hold when prefers-reduced-motion is set', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal('matchMedia', matchMedia);

    mount({ open: true, targetUid: 'u2', isSelf: false, canCompare: true });
    act(() => {
      latest?.togglePk();
    });
    expect(latest?.pkPhase).toBe('clashed');
    expect(latest?.activeComparisonPoints).toEqual(cmpPoints);

    act(() => {
      latest?.togglePk();
    });
    expect(latest?.pkPhase).toBe('idle');
    expect(latest?.pkLayerActive).toBe(false);
    expect(latest?.presentation).toBe('ritual');
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('ignores toggle while scanning', () => {
    mount({ open: true, targetUid: 'u2', isSelf: false, canCompare: true });
    act(() => {
      latest?.togglePk();
    });
    expect(latest?.pkPhase).toBe('scanning');
    act(() => {
      latest?.togglePk();
    });
    expect(latest?.pkPhase).toBe('scanning');
  });

  it('resets when targetUid changes', () => {
    mount({ open: true, targetUid: 'u2', isSelf: false, canCompare: true });
    advanceToClashed();

    act(() => {
      root.render(
        <Probe
          open
          targetUid="u3"
          isSelf={false}
          canCompare
          onReady={(api) => {
            latest = api;
          }}
        />
      );
    });
    expect(latest?.pkPhase).toBe('idle');
    expect(latest?.pkActive).toBe(false);
    expect(latest?.pkLayerActive).toBe(false);
    expect(latest?.presentation).toBe('ritual');
  });

  it('hides toggle for self', () => {
    mount({ open: true, targetUid: 'me', isSelf: true, canCompare: true });
    expect(latest?.showPkToggle).toBe(false);
    act(() => {
      latest?.togglePk();
    });
    expect(latest?.pkActive).toBe(false);
  });

  it('resets when canCompare flips off', () => {
    mount({ open: true, targetUid: 'u2', isSelf: false, canCompare: true });
    advanceToClashed();

    act(() => {
      root.render(
        <Probe
          open
          targetUid="u2"
          isSelf={false}
          canCompare={false}
          onReady={(api) => {
            latest = api;
          }}
        />
      );
    });
    expect(latest?.showPkToggle).toBe(false);
    expect(latest?.pkPhase).toBe('idle');
    expect(latest?.pkActive).toBe(false);
    expect(latest?.pkLayerActive).toBe(false);
    expect(latest?.presentation).toBe('ritual');
  });
});
