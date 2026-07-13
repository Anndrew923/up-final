/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AssessmentPage from '../AssessmentPage';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockAddHistoryRecord = vi.fn();

vi.mock('../../hooks/useAssessmentLobbyCards', () => ({
  useAssessmentLobbyCards: () => [
    { key: 'strength', to: '/strength', title: 'Strength' },
    { key: 'grip', to: '/grip', title: 'Grip' },
  ],
}));

vi.mock('../../hooks/useMergedScoresFromLocalStores', () => ({
  useMergedScoresFromLocalStores: () => ({
    strength: 81.57,
    gripStrength: 91,
    bodyFat: 84.8,
    explosivePower: 102.92,
    cardio: 113.33,
    muscleMass: 63.73,
  }),
}));

vi.mock('../../stores/historyStore', () => ({
  useHistoryStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      addHistoryRecord: mockAddHistoryRecord,
    }),
}));

vi.mock('../../components/assessment/AssessmentLobbyCard', () => ({
  AssessmentLobbyCard: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../../components/assessment/SomatotypeLabEntryCard', () => ({
  SomatotypeLabEntryCard: () => <div data-testid="somatotype-entry" />,
}));

vi.mock('../../lib/generateLocalId', () => ({
  generateLocalId: () => 'test-history-id',
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'assessment.title': 'DYNO',
        'assessment.sixAxisSnapshot.title': 'Performance Snapshot',
        'assessment.sixAxisSnapshot.toggleExpand': 'Expand performance snapshot',
        'assessment.sixAxisSnapshot.toggleCollapse': 'Collapse performance snapshot',
        'assessment.sixAxisSnapshot.saveSnapshot': 'Snapshot Status to Logs',
        'assessment.sixAxisSnapshot.saveDone': 'Snapshot archived',
        'axisLexicon.output.full.strength': 'Horsepower',
        'axisLexicon.output.full.bodyFat': 'Displacement',
        'axisLexicon.output.full.cardio': 'Stint',
        'axisLexicon.output.full.gripStrength': 'Traction',
        'axisLexicon.output.full.explosivePower': 'Torque',
        'axisLexicon.output.full.muscleMass': 'Exterior',
      };
      return map[key] ?? key;
    },
  }),
}));

function renderPage(): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AssessmentPage />
      </MemoryRouter>
    );
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

afterEach(() => {
  mockAddHistoryRecord.mockReset();
  document.body.innerHTML = '';
});

describe('AssessmentPage read-only six-axis snapshot', () => {
  it('keeps axis readouts and archive button collapsed by default', () => {
    const { container, unmount } = renderPage();

    const toggle = container.querySelector(
      '#dyno-six-axis-snapshot-toggle'
    ) as HTMLButtonElement;
    const panel = container.querySelector('#dyno-six-axis-snapshot-panel');

    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(container.textContent).toContain('Performance Snapshot');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.textContent).toContain('Horsepower');
    expect(panel?.textContent).toContain('81.57');
    expect(panel?.textContent).toContain('Snapshot Status to Logs');
    expect(container.querySelectorAll('input')).toHaveLength(0);

    unmount();
  });

  it('reveals readouts on expand and archives a compatible history snapshot', () => {
    const { container, unmount } = renderPage();

    const toggle = container.querySelector(
      '#dyno-six-axis-snapshot-toggle'
    ) as HTMLButtonElement;
    const panel = container.querySelector('#dyno-six-axis-snapshot-panel');

    act(() => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);

    const saveBtn = Array.from(panel?.querySelectorAll('button') ?? []).find(
      (b) => b.textContent === 'Snapshot Status to Logs'
    );
    expect(saveBtn).toBeTruthy();

    act(() => {
      saveBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mockAddHistoryRecord).toHaveBeenCalledTimes(1);
    const record = mockAddHistoryRecord.mock.calls[0][0] as {
      id: string;
      createdAt: string;
      scores: Record<string, number>;
      overallScore: number;
    };
    expect(record.id).toBe('test-history-id');
    expect(typeof record.createdAt).toBe('string');
    expect(record.scores).toEqual({
      strength: 81.57,
      gripStrength: 91,
      bodyFat: 84.8,
      explosivePower: 102.92,
      cardio: 113.33,
      muscleMass: 63.73,
    });
    expect(typeof record.overallScore).toBe('number');
    expect(panel?.textContent).toContain('Snapshot archived');

    unmount();
  });
});
