/* @vitest-environment jsdom */
import React, { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CardioAssessmentPage from '../CardioAssessmentPage';

const mockUseCardioAssessmentPage = vi.fn();
const mockUseScoreMeaning = vi.fn();
const mockRevealCalculate = vi.fn();
let lastRevealFlowMetric: string | undefined;

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../hooks/useCardioAssessmentPage', () => ({
  useCardioAssessmentPage: () => mockUseCardioAssessmentPage(),
}));

vi.mock('../../hooks/useScoreMeaning', () => ({
  useScoreMeaning: (...args: unknown[]) => mockUseScoreMeaning(...args),
}));

vi.mock('../../hooks/useAssessmentRevealFlow', () => ({
  useAssessmentRevealFlow: (options: { metric: string }) => {
    lastRevealFlowMetric = options.metric;
    return {
    ceremony: {
      isActive: false,
      statusLine: '',
      scanningLabel: '',
      overlayAriaLabel: '',
      wrapCalculate: vi.fn(),
      cancel: vi.fn(),
    },
    phase: 'idle',
    isBlocking: false,
    displayScore: null,
    revealCalculate: mockRevealCalculate,
    modalOpen: false,
    modalPayload: null,
    closeModal: vi.fn(),
    };
  },
}));

vi.mock('../../components/assessment/AssessmentCeremonyOverlay', () => ({
  default: () => null,
}));

vi.mock('../../components/assessment/PerformanceBreakthroughModal', () => ({
  default: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'cardio.performanceSpecHeader') return 'PERFORMANCE SPEC / Thermal Spec';
      if (key === 'cardio.nextMilestoneHint') return `Next Milestone: ${String(options?.points)}`;
      if (key === 'cardio.calculate') return 'Calculate';
      return key;
    },
  }),
}));

vi.mock('../../components/DisclosurePanel', () => ({
  DisclosurePanel: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../components/ladder/LeaderboardAssessmentSyncBar', () => ({
  default: () => <div data-testid="leaderboard-sync-bar" />,
}));

function renderPage(): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <CardioAssessmentPage />
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
  mockUseCardioAssessmentPage.mockReset();
  mockUseScoreMeaning.mockReset();
  mockRevealCalculate.mockReset();
  lastRevealFlowMetric = undefined;
});

describe('CardioAssessmentPage', () => {
  it('shows performance spec and wires reveal flow on calculate', () => {
    mockUseCardioAssessmentPage.mockReturnValue({
      profileReady: true,
      cooperDistanceOverCap: false,
      cooperCapMeters: 3200,
      activeTab: 'cooper',
      setActiveTab: vi.fn(),
      distanceInput: '2800',
      setDistanceInput: vi.fn(),
      runMinutesInput: '',
      setRunMinutesInput: vi.fn(),
      runSecondsInput: '',
      setRunSecondsInput: vi.fn(),
      previewScore: 88.5,
      submitDone: false,
      errorKey: null,
      clearError: vi.fn(),
      calculate: vi.fn(),
      submitToRadar: vi.fn(),
    });
    mockUseScoreMeaning.mockReturnValue({
      title: 'Thermal Elite',
      summary: 'Endurance axis stabilized.',
      nextMilestone: 91,
      remainingPoints: 3,
    });

    const { container, unmount } = renderPage();
    const text = container.textContent ?? '';

    expect(mockUseScoreMeaning).toHaveBeenCalledWith('cooper', 88.5);
    expect(lastRevealFlowMetric).toBe('cooper');
    expect(text).toContain('PERFORMANCE SPEC / Thermal Spec');
    expect(text).toContain('Thermal Elite');
    expect(text).toContain('Next Milestone: 3');

    const calculateBtn = Array.from(container.querySelectorAll('button')).find((el) =>
      el.textContent?.includes('Calculate')
    );
    expect(calculateBtn).toBeDefined();
    act(() => {
      calculateBtn!.click();
    });
    expect(mockRevealCalculate).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('disables calculate when profile is incomplete', () => {
    mockUseCardioAssessmentPage.mockReturnValue({
      profileReady: false,
      cooperDistanceOverCap: false,
      cooperCapMeters: null,
      activeTab: 'cooper',
      setActiveTab: vi.fn(),
      distanceInput: '',
      setDistanceInput: vi.fn(),
      runMinutesInput: '',
      setRunMinutesInput: vi.fn(),
      runSecondsInput: '',
      setRunSecondsInput: vi.fn(),
      previewScore: null,
      submitDone: false,
      errorKey: null,
      clearError: vi.fn(),
      calculate: vi.fn(),
      submitToRadar: vi.fn(),
    });
    mockUseScoreMeaning.mockReturnValue(null);

    const { container, unmount } = renderPage();
    const calculateBtn = Array.from(container.querySelectorAll('button')).find((el) =>
      el.textContent?.includes('Calculate')
    );
    expect(calculateBtn?.disabled).toBe(true);

    unmount();
  });

  it('routes score meaning to cardio on 5km tab', () => {
    mockUseCardioAssessmentPage.mockReturnValue({
      profileReady: true,
      cooperDistanceOverCap: false,
      cooperCapMeters: null,
      activeTab: '5km',
      setActiveTab: vi.fn(),
      distanceInput: '',
      setDistanceInput: vi.fn(),
      runMinutesInput: '22',
      setRunMinutesInput: vi.fn(),
      runSecondsInput: '30',
      setRunSecondsInput: vi.fn(),
      previewScore: 72.25,
      submitDone: false,
      errorKey: null,
      clearError: vi.fn(),
      calculate: vi.fn(),
      submitToRadar: vi.fn(),
    });
    mockUseScoreMeaning.mockReturnValue({
      title: 'Cruise Tier',
      summary: '5km endurance copy path.',
      nextMilestone: 80,
      remainingPoints: 8,
    });

    const { unmount } = renderPage();

    expect(mockUseScoreMeaning).toHaveBeenCalledWith('cardio', 72.25);
    expect(lastRevealFlowMetric).toBe('cardio');

    unmount();
  });
});
