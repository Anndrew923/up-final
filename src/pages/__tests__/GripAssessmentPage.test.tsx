/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GripAssessmentPage from '../GripAssessmentPage';

const mockUseGripAssessmentPage = vi.fn();
const mockUseScoreMeaning = vi.fn();

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

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
      if (key === 'grip.nextMilestoneHint') {
        return `${String(options?.points)} pts until next tier upgrade`;
      }
      if (key === 'grip.nextMilestoneHintWithRaw') {
        return `${String(options?.points)} pts until next tier upgrade (approx. +${String(options?.delta)} ${String(options?.unit)})`;
      }
      if (key === 'home.profile.male') return 'Male';
      if (key === 'home.profile.female') return 'Female';
      if (key === 'units.weight.kg') return 'kg';
      if (key === 'units.weight.lb') return 'lb';
      if (key === 'units.length.cm') return 'cm';
      if (key === 'units.length.in') return 'in';
      if (key === 'units.system.metric') return 'Metric';
      if (key === 'units.system.imperial') return 'Imperial';
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
  it('shows top-tier meaning and hides next milestone at previewScore=191', () => {
    mockUseGripAssessmentPage.mockReturnValue({
      profile: { gender: 'male', weightKg: 80 },
      profileReady: true,
      peakInput: '120',
      setPeakInput: vi.fn(),
      previewScore: 191,
      capNotice: null,
      errorKey: null,
      submitDone: false,
      clearError: vi.fn(),
      calculate: vi.fn(),
      submitToRadar: vi.fn(),
    });
    mockUseScoreMeaning.mockReturnValue({
      title: 'Pantheon Compression',
      summary: 'Model ceiling reached.',
      nextMilestone: null,
      remainingPoints: null,
    });

    const { container, unmount } = renderPage();
    const text = container.textContent ?? '';

    expect(mockUseScoreMeaning).toHaveBeenCalledWith('gripStrength', 191);
    expect(text).toContain('PERFORMANCE SPEC / Potential Spec');
    expect(text).toContain('Pantheon Compression');
    expect(text).toContain('Model ceiling reached.');
    expect(text).not.toContain('pts until next tier upgrade');
    expect(text).not.toContain('grip.metaWeight');
    expect(text).not.toContain('80');

    unmount();
  });

  it('shows gender scoring baseline badge only (no weight meta)', () => {
    mockUseGripAssessmentPage.mockReturnValue({
      profile: { gender: 'male', weightKg: 92.8 },
      profileReady: true,
      peakInput: '',
      setPeakInput: vi.fn(),
      previewScore: null,
      capNotice: null,
      errorKey: null,
      submitDone: false,
      clearError: vi.fn(),
      calculate: vi.fn(),
      submitToRadar: vi.fn(),
    });
    mockUseScoreMeaning.mockReturnValue({
      title: null,
      summary: null,
      nextMilestone: null,
      remainingPoints: null,
    });

    const { container, unmount } = renderPage();
    const badge = container.querySelector('[aria-label]');

    expect(badge?.textContent).toBe('Male');
    expect(container.textContent).not.toContain('grip.metaWeight');
    expect(container.textContent).not.toContain('92.8');

    unmount();
  });

  it('shows raw kg gap beside points when next milestone exists', () => {
    mockUseGripAssessmentPage.mockReturnValue({
      profile: { gender: 'male', weightKg: 75 },
      profileReady: true,
      peakInput: '45',
      setPeakInput: vi.fn(),
      previewScore: 63,
      capNotice: null,
      errorKey: null,
      submitDone: false,
      clearError: vi.fn(),
      calculate: vi.fn(),
      persistToDashboard: vi.fn(),
      submitToRadar: vi.fn(),
    });
    mockUseScoreMeaning.mockReturnValue({
      title: 'Track Semi-Slick',
      summary: 'Mountain drift copy.',
      nextMilestone: 70,
      remainingPoints: 7,
    });

    const { container, unmount } = renderPage();
    const text = container.textContent ?? '';

    expect(text).toContain('Track Semi-Slick');
    expect(text).toMatch(/7 pts until next tier upgrade \(approx\. \+\d+(\.\d)? kg\)/);
    expect(text).not.toMatch(/7 pts until next tier upgrade$/m);

    unmount();
  });

  it('falls back to points-only hint when peak input cannot resolve raw gap', () => {
    mockUseGripAssessmentPage.mockReturnValue({
      profile: { gender: 'male', weightKg: 75 },
      profileReady: true,
      peakInput: '',
      setPeakInput: vi.fn(),
      previewScore: 63,
      capNotice: null,
      errorKey: null,
      submitDone: false,
      clearError: vi.fn(),
      calculate: vi.fn(),
      persistToDashboard: vi.fn(),
      submitToRadar: vi.fn(),
    });
    mockUseScoreMeaning.mockReturnValue({
      title: 'Track Semi-Slick',
      summary: 'Mountain drift copy.',
      nextMilestone: 70,
      remainingPoints: 7,
    });

    const { container, unmount } = renderPage();
    expect(container.textContent).toContain('7 pts until next tier upgrade');
    expect(container.textContent).not.toContain('approx.');

    unmount();
  });
});
