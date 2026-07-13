/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SomatotypeScientificAppendix } from '../SomatotypeScientificAppendix';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'tools.somatotypeLab.appendix.title': 'Heath–Carter Somatotype Algorithm Guide',
        'tools.somatotypeLab.appendix.heathCarter': 'WRIST_PROXY_RESIDUAL_BODY',
        'tools.somatotypeLab.appendix.genderTracks': 'GENDER_TRACKS_BODY',
        'tools.somatotypeLab.appendix.legendaryDefense': 'LEGENDARY_DEFENSE_BODY',
        'tools.somatotypeLab.appendix.biaDisclaimer': 'BIA_DISCLAIMER_BODY',
      };
      return map[key] ?? key;
    },
  }),
}));

function renderAppendix(): { container: HTMLDivElement; unmount: () => void; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<SomatotypeScientificAppendix />);
  });
  return {
    container,
    root,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('SomatotypeScientificAppendix', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders algorithm-guide keys, stays collapsed, and avoids toy emoji chrome', () => {
    const { container, unmount } = renderAppendix();
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details!.open).toBe(false);
    expect(container.textContent).toContain('Heath–Carter Somatotype Algorithm Guide');
    expect(container.textContent).toContain('WRIST_PROXY_RESIDUAL_BODY');
    expect(container.textContent).toContain('GENDER_TRACKS_BODY');
    expect(container.textContent).toContain('LEGENDARY_DEFENSE_BODY');
    expect(container.textContent).toContain('BIA_DISCLAIMER_BODY');
    expect(container.textContent).not.toMatch(/🔬|📋|💡|👑|\//);
    unmount();
  });

  it('resets to collapsed after remount (no sticky open state)', () => {
    const { container, root, unmount } = renderAppendix();
    const details = container.querySelector('details')!;
    act(() => {
      details.open = true;
    });
    expect(details.open).toBe(true);

    act(() => {
      root.render(<SomatotypeScientificAppendix key="remount-b" />);
    });
    const remounted = container.querySelector('details');
    expect(remounted).not.toBeNull();
    expect(remounted!.open).toBe(false);
    unmount();
  });
});
