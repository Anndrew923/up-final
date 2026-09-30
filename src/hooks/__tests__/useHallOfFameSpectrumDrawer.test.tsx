/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHallOfFameSpectrumDrawer } from '../useHallOfFameSpectrumDrawer';
import { useDynoIntelLaunchStore } from '../../stores/dynoIntelLaunchStore';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'assessment.axis.strength') return '馬力';
      if (key === 'assessment.hallSpectrum.openBadgeAria') {
        return `Open ${String(options?.populationClass ?? '')}`;
      }
      return key;
    },
    i18n: { language: 'zh-Hant' },
  }),
}));

vi.mock('../useDynoIntelQuota', () => ({
  useDynoIntelQuota: () => ({
    remaining: 2,
    limit: 2,
    quotaTier: 'trial',
    resetAt: null,
    syncToken: 'tok',
    isSynced: true,
    isSyncTokenCurrent: () => true,
    applyServerQuota: vi.fn(),
  }),
}));

function HookProbe({
  onSample,
}: {
  onSample: (value: ReturnType<typeof useHallOfFameSpectrumDrawer>) => void;
}) {
  const value = useHallOfFameSpectrumDrawer({
    axisId: 'strength',
    scoreDisplay: '76.80',
    decadeKey: '70',
    populationClass: '進階訓練者',
  });
  onSample(value);
  return null;
}

function IncompleteProbe({
  onSample,
}: {
  onSample: (value: ReturnType<typeof useHallOfFameSpectrumDrawer>) => void;
}) {
  const value = useHallOfFameSpectrumDrawer({
    axisId: 'strength',
    scoreDisplay: null,
    decadeKey: '70',
    populationClass: '進階訓練者',
  });
  onSample(value);
  return null;
}

describe('useHallOfFameSpectrumDrawer', () => {
  let container: HTMLDivElement;
  let root: Root;
  let latest: ReturnType<typeof useHallOfFameSpectrumDrawer> | null;

  beforeEach(() => {
    useDynoIntelLaunchStore.setState({ pendingPrompt: null, requestId: 0 });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    latest = null;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('exposes interactive badge props and opens the drawer', () => {
    act(() => {
      root.render(<HookProbe onSample={(value) => { latest = value; }} />);
    });

    expect(latest?.badgeProps.onBadgeClick).toBeTypeOf('function');
    expect(latest?.badgeProps.showChevron).toBe(true);
    expect(latest?.badgeProps.badgeAriaLabel).toContain('進階訓練者');
    expect(latest?.drawerProps.open).toBe(false);
    expect(latest?.drawerProps.dynoRemaining).toBe(2);
    expect(latest?.drawerProps.axisTitle).toBe('馬力');

    act(() => {
      latest?.badgeProps.onBadgeClick?.();
    });
    expect(latest?.drawerProps.open).toBe(true);
  });

  it('stays non-interactive without a complete score payload', () => {
    act(() => {
      root.render(<IncompleteProbe onSample={(value) => { latest = value; }} />);
    });

    expect(latest?.badgeProps.onBadgeClick).toBeUndefined();
    expect(latest?.badgeProps.showChevron).toBe(false);
  });

  it('queues a Dyno decode prompt on CTA handoff', async () => {
    act(() => {
      root.render(<HookProbe onSample={(value) => { latest = value; }} />);
    });

    act(() => {
      latest?.drawerProps.onOpenDyno();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const launch = useDynoIntelLaunchStore.getState();
    expect(launch.requestId).toBe(1);
    expect(launch.pendingPrompt).toContain('馬力');
    expect(launch.pendingPrompt).toContain('76.80');
    expect(launch.pendingPrompt).toContain('進階訓練者');
  });
});
