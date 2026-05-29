/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import {
  useHomeSectionExpanded,
  type UseHomeSectionExpandedOptions,
} from '../useHomeSectionExpanded';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderHarness(options: UseHomeSectionExpandedOptions): {
  getCurrent: () => ReturnType<typeof useHomeSectionExpanded> | null;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: ReturnType<typeof useHomeSectionExpanded> | null = null;

  function Harness() {
    latest = useHomeSectionExpanded(options);
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

afterEach(() => {
  sessionStorage.clear();
  document.body.innerHTML = '';
});

describe('useHomeSectionExpanded', () => {
  it('uses defaultExpanded when no session preference', () => {
    const harness = renderHarness({
      sectionId: 'test-profile',
      forceExpanded: false,
      defaultExpanded: false,
    });
    expect(harness.getCurrent()!.expanded).toBe(false);
    harness.unmount();
  });

  it('forces expanded and blocks collapse when forceExpanded', () => {
    const harness = renderHarness({
      sectionId: 'test-profile',
      forceExpanded: true,
      defaultExpanded: false,
    });
    expect(harness.getCurrent()!.expanded).toBe(true);
    expect(harness.getCurrent()!.canCollapse).toBe(false);
    act(() => {
      harness.getCurrent()!.setExpanded(false);
    });
    expect(harness.getCurrent()!.expanded).toBe(true);
    harness.unmount();
  });

  it('persists user toggle in sessionStorage', () => {
    const harness = renderHarness({
      sectionId: 'test-ladder',
      forceExpanded: false,
      defaultExpanded: true,
    });
    act(() => {
      harness.getCurrent()!.setExpanded(false);
    });
    expect(sessionStorage.getItem('up.home.section.test-ladder')).toBe('false');
    harness.unmount();

    const reloaded = renderHarness({
      sectionId: 'test-ladder',
      forceExpanded: false,
      defaultExpanded: true,
    });
    expect(reloaded.getCurrent()!.expanded).toBe(false);
    reloaded.unmount();
  });
});
