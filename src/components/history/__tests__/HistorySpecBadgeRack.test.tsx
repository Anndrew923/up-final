/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18n from '../../../i18n';
import type { SpecBadgeView } from '../../../logic/core/trainingFootprintBadges';
import {
  CORE_SPEC_BADGE_IDS,
  OPTIONAL_SPEC_BADGE_IDS,
} from '../../../logic/core/trainingFootprint';
import HistorySpecBadgeRack from '../HistorySpecBadgeRack';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const SAMPLE_BADGES: SpecBadgeView[] = [...CORE_SPEC_BADGE_IDS, ...OPTIONAL_SPEC_BADGE_IDS].map(
  (id) => ({
    id,
    unlocked: false,
    current: 0,
    target: 1,
  })
);

const EMPTY_UNSEEN = new Set<string>();

function renderRack(
  inspectionEnabled = true,
  focusedBadgeId: string | null = null
): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <HistorySpecBadgeRack
          badges={SAMPLE_BADGES}
          inspectionEnabled={inspectionEnabled}
          unseenBadgeIds={EMPTY_UNSEEN}
          focusedBadgeId={focusedBadgeId}
        />
      </I18nextProvider>
    );
  });
  return { container, root };
}

function plateButton(container: HTMLElement, name: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((node) =>
    (node.getAttribute('aria-label') ?? '').startsWith(name)
  );
  if (!button) throw new Error(`Missing plate button: ${name}`);
  return button as HTMLButtonElement;
}

describe('HistorySpecBadgeRack', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  afterEach(async () => {
    document.body.innerHTML = '';
    await i18n.changeLanguage('zh-Hant');
  });

  it('anchors inspect copy under the selected plate row and closes on toggle or Escape', () => {
    const { container, root } = renderRack();
    const ignDesc = '有一天做過測功';
    const arcDesc = '在測功分頁存下第一筆六軸成績。';

    expect(container.textContent).not.toContain(ignDesc);

    act(() => {
      plateButton(container, '初次回火').click();
    });

    const ignPanel = container.querySelector('#spec-badge-inspect-IGN-01');
    expect(ignPanel).not.toBeNull();
    expect(ignPanel?.textContent).toContain(ignDesc);
    expect(ignPanel?.closest('li')?.className).toContain('col-span-3');
    expect(plateButton(container, '初次回火').getAttribute('aria-expanded')).toBe('true');

    act(() => {
      plateButton(container, '首份入庫').click();
    });

    expect(container.querySelector('#spec-badge-inspect-IGN-01')).toBeNull();
    expect(container.querySelector('#spec-badge-inspect-ARC-01')?.textContent).toContain(arcDesc);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(container.querySelector('#spec-badge-inspect-ARC-01')).toBeNull();

    act(() => root.unmount());
  });

  it('clears inspect copy when the parent rhythm panel collapses', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <HistorySpecBadgeRack badges={SAMPLE_BADGES} inspectionEnabled unseenBadgeIds={EMPTY_UNSEEN} />
        </I18nextProvider>
      );
    });

    act(() => {
      plateButton(container, '初次回火').click();
    });
    expect(container.querySelector('#spec-badge-inspect-IGN-01')).not.toBeNull();

    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <HistorySpecBadgeRack badges={SAMPLE_BADGES} inspectionEnabled={false} unseenBadgeIds={EMPTY_UNSEEN} />
        </I18nextProvider>
      );
    });

    expect(container.querySelector('#spec-badge-inspect-IGN-01')).toBeNull();

    act(() => root.unmount());
  });

  it('applies unseen-glow animation class only to badges in the unseen set', () => {
    const unseenIds = new Set(['IGN-01']);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <HistorySpecBadgeRack badges={SAMPLE_BADGES} inspectionEnabled unseenBadgeIds={unseenIds} />
        </I18nextProvider>
      );
    });

    const allSvgs = Array.from(container.querySelectorAll('svg'));
    const glowing = allSvgs.filter((svg) => svg.classList.contains('animate-unseen-glow'));
    expect(glowing).toHaveLength(1);

    act(() => root.unmount());
  });

  it('opens and scroll-focuses the externally focused badge', () => {
    const original = HTMLElement.prototype.scrollIntoView;
    const scrollSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollSpy,
    });
    const { container, root } = renderRack(true, 'IGN-01');

    expect(container.querySelector('#spec-badge-inspect-IGN-01')).not.toBeNull();
    expect(container.querySelector('#spec-badge-trigger-IGN-01')).not.toBeNull();
    expect(scrollSpy).toHaveBeenCalled();

    act(() => root.unmount());
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: original,
    });
  });
});
