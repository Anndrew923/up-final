/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { resolveSixAxisInputShortLabel } from '../../i18n/resolveSixAxisInputShortLabel';
import type { LocalHistoryRecord } from '../../logic/core/localHistoryRecord';
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

describe('HistoryPage axis table headers', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  afterEach(() => {
    document.body.innerHTML = '';
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
});
