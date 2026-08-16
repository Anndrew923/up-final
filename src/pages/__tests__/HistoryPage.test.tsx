/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { resolveSixAxisInputShortLabel } from '../../i18n/resolveSixAxisInputShortLabel';
import type { LocalHistoryRecord } from '../../logic/core/localHistoryRecord';
import { HISTORY_TI_PLATE_GRAD_ID } from '../../components/history/TitaniumBadgeDefs';
import { WEEKLY_RHYTHM_TARGET } from '../../logic/core/trainingFootprint';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import HistoryPage from '../HistoryPage';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const SAMPLE_RECORD: LocalHistoryRecord = {
  id: 'history-test-1',
  createdAt: '2026-08-12T10:00:00.000Z',
  overallScore: 95.71,
  scores: {
    strength: 85.21,
    explosivePower: 124.44,
    cardio: 82,
    muscleMass: 95.92,
    bodyFat: 95,
    gripStrength: 80,
  },
};

vi.mock('../../services/localStorageService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/localStorageService')>();
  return {
    ...actual,
    loadHistory: () => [SAMPLE_RECORD],
  };
});

function renderHistoryPage(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <HistoryPage />
      </I18nextProvider>
    );
  });
  return { container, root };
}

describe('HistoryPage', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  afterEach(async () => {
    document.body.innerHTML = '';
    await i18n.changeLanguage('zh-Hant');
  });

  it('renders fitness-science axis headers, not mechanical output labels', async () => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const { container, root } = renderHistoryPage();

    await act(async () => {
      await Promise.resolve();
    });

    const headerText = container.querySelector('thead')?.textContent ?? '';
    for (const metric of SIX_AXIS_METRICS) {
      const scienceLabel = resolveSixAxisInputShortLabel(t, metric);
      expect(headerText).toContain(scienceLabel);
    }

    expect(headerText).not.toContain('馬力');
    expect(headerText).not.toContain('車體外觀');
    expect(headerText).not.toContain('引擎排量');

    act(() => root.unmount());
  });

  it('keeps dyno rhythm collapsed by default and reveals the matrix after expand', async () => {
    const { container, root } = renderHistoryPage();

    await act(async () => {
      await Promise.resolve();
    });

    const rhythmToggle = container.querySelector('#history-rhythm-toggle');
    const rhythmPanel = container.querySelector('#history-rhythm-panel');
    expect(rhythmToggle?.textContent).toContain('測功節奏');
    expect(rhythmToggle?.textContent).toContain(`本週 0/${WEEKLY_RHYTHM_TARGET}`);
    expect(rhythmToggle?.textContent).toContain('累積 0 天');
    expect(rhythmToggle?.textContent).toContain('展開測功節奏');
    expect(rhythmToggle?.className).toContain('rounded-lg');
    expect(rhythmToggle?.getAttribute('aria-label')).toBeNull();
    expect(rhythmToggle?.getAttribute('aria-expanded')).toBe('false');
    expect(rhythmPanel?.getAttribute('aria-hidden')).toBe('true');

    act(() => {
      (rhythmToggle as HTMLButtonElement).click();
    });

    expect(rhythmToggle?.getAttribute('aria-expanded')).toBe('true');
    expect(rhythmPanel?.getAttribute('aria-hidden')).toBe('false');
    expect(rhythmToggle?.textContent).not.toContain(`本週 0/${WEEKLY_RHYTHM_TARGET}`);
    expect(container.textContent).toContain('機體規格');
    expect(container.textContent).toContain('專項選配');
    expect(container.querySelector('[aria-label="本月測功點陣"]')).not.toBeNull();
    expect(container.querySelector(`#${HISTORY_TI_PLATE_GRAD_ID}`)).not.toBeNull();
    expect(container.textContent).toContain('IGN-01');
    expect(container.textContent).toContain('ARC-01');
    expect(container.textContent).toContain('RHY-03');
    expect(container.textContent).toContain('RUN-07');
    expect(container.textContent).toContain('SPEC-6');
    expect(container.textContent).toContain('ARM-01');
    expect(container.textContent).toContain('5K-01');
    expect(container.textContent).toContain('SPR-01');
    expect(container.textContent).toContain('SOM-01');

    act(() => root.unmount());
  });

  it('keeps the English dyno rhythm title fully visible above pills', async () => {
    await i18n.changeLanguage('en');
    const { container, root } = renderHistoryPage();

    await act(async () => {
      await Promise.resolve();
    });

    const rhythmToggle = container.querySelector('#history-rhythm-toggle');
    const titleEl = Array.from(rhythmToggle?.querySelectorAll('span') ?? []).find(
      (node) => node.textContent === 'Dyno Rhythm'
    );

    expect(titleEl?.textContent).toBe('Dyno Rhythm');
    expect(titleEl?.className).toContain('whitespace-nowrap');
    expect(titleEl?.className).not.toContain('truncate');
    expect(rhythmToggle?.className).toContain('flex-col');
    expect(rhythmToggle?.textContent).toContain(`This week 0/${WEEKLY_RHYTHM_TARGET}`);
    expect(rhythmToggle?.textContent).toContain('Lifetime 0 days');

    act(() => root.unmount());
  });
});
