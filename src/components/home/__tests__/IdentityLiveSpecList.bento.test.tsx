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
          <IdentityLiveSpecList variant="bento" kicker="六軸規格網格" rows={rows} />
        </I18nextProvider>
      );
    });

    const grid = document.querySelector('[data-testid="identity-live-spec-bento"] ul');
    expect(grid?.className).toContain('grid-cols-2');
    expect(document.body.textContent).toContain('HP //');
    expect(document.body.textContent).toContain('GRIP //');
    expect(document.body.textContent).toContain('strength-title');
  });
});
