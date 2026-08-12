/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveDynoTriggerPhaseAtIndex,
  useDynoIntelTriggerTicker,
  type DynoIntelTriggerTickerState,
} from '../useDynoIntelTriggerTicker';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../lib/motionPreference', () => ({
  usePrefersReducedMotion: () => false,
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderTickerHook(
  options: Parameters<typeof useDynoIntelTriggerTicker>[0] = {},
): {
  getCurrent: () => DynoIntelTriggerTickerState | null;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: DynoIntelTriggerTickerState | null = null;

  function Harness() {
    latest = useDynoIntelTriggerTicker(options);
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

describe('resolveDynoTriggerPhaseAtIndex', () => {
  it('maps ticker indices to B3 expand phases', () => {
    expect(resolveDynoTriggerPhaseAtIndex(0)).toBe('online');
    expect(resolveDynoTriggerPhaseAtIndex(1)).toBe('scanning');
    expect(resolveDynoTriggerPhaseAtIndex(2)).toBe('coreMax');
  });

  it('wraps negative and overflow indices safely', () => {
    expect(resolveDynoTriggerPhaseAtIndex(-1)).toBe('coreMax');
    expect(resolveDynoTriggerPhaseAtIndex(3)).toBe('online');
  });
});

describe('useDynoIntelTriggerTicker discoveryMode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('freezes on verb CTA copy and scanning phase', () => {
    const harness = renderTickerHook({ discoveryMode: true, enabled: true });
    const current = harness.getCurrent();
    expect(current?.label).toBe('dynoIntel.triggerDiscovery.cta');
    expect(current?.phase).toBe('scanning');
    expect(current?.index).toBe(0);
    harness.unmount();
  });
});
