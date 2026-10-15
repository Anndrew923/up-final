/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18n from '../../../i18n';
import type { LocalHistoryRecord } from '../../../logic/core/localHistoryRecord';
import { SIX_AXIS_METRICS } from '../../../types/scoring';
import HistoryLogCard from '../HistoryLogCard';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const BASE_RECORD: LocalHistoryRecord = {
  id: 'row-1',
  createdAt: '2026-10-15T03:24:00.000Z',
  overallScore: 88.5,
  scores: {
    strength: 81.3,
    explosivePower: 111.7,
    cardio: 72,
    muscleMass: 98.1,
    bodyFat: 98.2,
    gripStrength: 91,
  },
};

function renderCard(record: LocalHistoryRecord): {
  container: HTMLDivElement;
  root: Root;
  onDelete: ReturnType<typeof vi.fn>;
} {
  const onDelete = vi.fn();
  const container = document.createElement('div');
  container.style.width = '360px';
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <div className="mx-auto w-full max-w-md">
          <HistoryLogCard record={record} valueEmptyLabel="—" onDelete={onDelete} />
        </div>
      </I18nextProvider>
    );
  });
  return { container, root, onDelete };
}

describe('HistoryLogCard', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a card with 3×2 six-axis bento and no table chrome', () => {
    const { container, root } = renderCard(BASE_RECORD);
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('[data-testid="history-log-card"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="history-card-overall"]')?.textContent).toBe(
      '88.50'
    );

    const grid = container.querySelector('[data-testid="history-card-axis-grid"]');
    expect(grid?.className).toContain('grid-cols-3');
    expect(grid?.children.length).toBe(SIX_AXIS_METRICS.length);
    expect(grid?.textContent).toContain('力量');
    expect(grid?.textContent).toContain('爆發');
    expect(grid?.textContent).toContain('心肺');
    expect(grid?.textContent).toContain('肌量');
    expect(grid?.textContent).toContain('FFMI');
    expect(grid?.textContent).toContain('握力');
    expect(grid?.textContent).toContain('81.30');
    expect(grid?.textContent).toContain('111.70');
    expect(container.querySelector('[data-testid="history-raw-badge"]')).toBeNull();

    const savedAt = container.querySelector('[data-testid="history-card-saved-at"]');
    expect(savedAt?.textContent).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/);
    expect(savedAt?.className).toContain('whitespace-nowrap');
    expect(savedAt?.className).not.toContain('truncate');
    expect(savedAt?.textContent).not.toContain('…');
    expect(savedAt?.textContent).not.toContain('...');
    act(() => root.unmount());
  });

  it('shows RAW badge and expands telemetry under the axis grid', () => {
    const { container, root } = renderCard({
      ...BASE_RECORD,
      rawInputs: {
        schemaVersion: 1,
        grip: { peakKg: 51 },
      },
    });
    expect(container.querySelector('[data-testid="history-raw-badge"]')?.textContent).toContain(
      '細項'
    );
    expect(container.querySelector('[data-testid="history-raw-telemetry-grid"]')).toBeNull();

    const toggle = container.querySelector('button[aria-expanded="false"]');
    expect(toggle).toBeTruthy();
    const panelId = toggle?.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).toBeTruthy();

    act(() => {
      toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    const panel = container.querySelector('[data-testid="history-card-raw-panel"]');
    expect(panel?.getAttribute('aria-hidden')).toBe('false');
    expect(container.querySelector('[data-testid="history-raw-telemetry-grid"]')?.textContent).toContain(
      '51'
    );
    act(() => root.unmount());
  });

  it('keeps card within a 360px viewport shell without overflow-x utilities', () => {
    const { container, root } = renderCard(BASE_RECORD);
    const card = container.querySelector('[data-testid="history-log-card"]');
    expect(card?.className).not.toContain('overflow-x');
    expect(card?.className).not.toContain('min-w-[');
    expect(container.innerHTML).not.toContain('overflow-x-auto');
    act(() => root.unmount());
  });
});
