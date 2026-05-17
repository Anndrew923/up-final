/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GripAssessmentPage from '../GripAssessmentPage';

const mockUseGripAssessmentPage = vi.fn();
const mockUseScoreMeaning = vi.fn();

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

vi.mock('../../hooks/useGripAssessmentPage', () => ({
  useGripAssessmentPage: () => mockUseGripAssessmentPage(),
}));

vi.mock('../../hooks/useScoreMeaning', () => ({
  useScoreMeaning: (...args: unknown[]) => mockUseScoreMeaning(...args),
}));

vi.mock('../../hooks/useAssessmentRevealFlow', () => ({
  useAssessmentRevealFlow: () => ({
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
    revealCalculate: vi.fn(),
    modalOpen: false,
    modalPayload: null,
    closeModal: vi.fn(),
  }),
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
      if (key === 'grip.performanceSpecHeader') return 'PERFORMANCE SPEC / Potential Spec';
      if (key === 'grip.nextMilestoneHint') return `Next Milestone: ${String(options?.points)}`;
      if (key === 'home.profile.male') return 'Male';
      if (key === 'home.profile.female') return 'Female';
      return key;
    },
  }),
}));

vi.mock('../../components/DisclosurePanel', () => ({
  DisclosurePanel: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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
        <GripAssessmentPage />
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
  mockUseGripAssessmentPage.mockReset();
  mockUseScoreMeaning.mockReset();
});

describe('GripAssessmentPage performance spec', () => {
  it('shows top-tier meaning and hides next milestone at previewScore=181', () => {
    mockUseGripAssessmentPage.mockReturnValue({
      profile: { gender: 'male', weightKg: 80 },
      profileReady: true,
      peakKgInput: '120',
      setPeakKgInput: vi.fn(),
      previewScore: 181,
      capNotice: null,
      errorKey: null,
      submitDone: false,
      clearError: vi.fn(),
      calculate: vi.fn(),
      submitToRadar: vi.fn(),
    });
    mockUseScoreMeaning.mockReturnValue({
      title: 'Pantheon Serial',
      summary: 'Legend-tier data overflow.',
      nextMilestone: null,
      remainingPoints: null,
    });

    const { container, unmount } = renderPage();
    const text = container.textContent ?? '';

    expect(mockUseScoreMeaning).toHaveBeenCalledWith('gripStrength', 181);
    expect(text).toContain('PERFORMANCE SPEC / Potential Spec');
    expect(text).toContain('Pantheon Serial');
    expect(text).toContain('Legend-tier data overflow.');
    expect(text).not.toContain('Next Milestone:');

    unmount();
  });
});
