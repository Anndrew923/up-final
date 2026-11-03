/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { SIX_AXIS_METRICS } from '../../../types/scoring';
import IdentityLiveSpecList from '../IdentityLiveSpecList';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('IdentityLiveSpecList bento', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders a fixed 2×3 grid with axis code tags', () => {
    const rows = SIX_AXIS_METRICS.map((metric) => ({
      metric,
      bandTitle: `${metric}-title`,
    }));

    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <IdentityLiveSpecList kicker="六軸即時規格" rows={rows} />
        </I18nextProvider>
      );
    });

    const bento = document.querySelector('[data-testid="identity-live-spec-bento"]');
    const grid = bento?.querySelector('ul');
    const kicker = bento?.querySelector('p');
    expect(grid?.className).toContain('grid-cols-2');
    expect(grid?.className).toContain('items-stretch');
    expect(kicker?.className).toContain('text-zinc-500');
    expect(kicker?.textContent).toContain('六軸即時規格');
    expect(document.body.textContent).toContain('HP //');
    expect(document.body.textContent).toContain('GRIP //');
    expect(document.body.textContent).toContain('strength-title');

    const cell = document.querySelector(
      '[data-testid="identity-live-spec-cell-strength"]'
    ) as HTMLElement | null;
    expect(cell?.className).toContain('min-h-[82px]');
    expect(cell?.className).toContain('justify-between');
    // Title sits in a locked 2.5rem flex row so single/double-line bands share one baseline band.
    expect(cell?.innerHTML).toContain('min-h-[2.5rem]');
    expect(cell?.innerHTML).toContain('text-[13px]');
    expect(cell?.innerHTML).toContain('leading-tight');
    expect(cell?.textContent).toContain('strength-title');
  });
});
