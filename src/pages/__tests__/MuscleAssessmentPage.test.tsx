/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MuscleAssessmentPage from '../MuscleAssessmentPage';

const mockUseMuscleAssessmentPage = vi.fn();
const mockUseScoreMeaning = vi.fn();

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../hooks/useMuscleAssessmentPage', () => ({
  useMuscleAssessmentPage: () => mockUseMuscleAssessmentPage(),
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

vi.mock('../../hooks/useLeaderboardSyncAssessmentPage', () => ({
  useLeaderboardSyncAssessmentPage: () => ({
    syncPage: vi.fn(),
    busy: false,
    summary: null,
    failures: [],
    gate: 'ok',
    targetCount: 0,
    goJoinArena: vi.fn(),
    clearFeedback: vi.fn(),
  }),
}));

vi.mock('../../components/assessment/AssessmentCeremonyOverlay', () => ({
  default: () => null,
}));

vi.mock('../../components/assessment/PerformanceBreakthroughModal', () => ({
  default: () => null,
}));

vi.mock('../../components/ladder/LeaderboardAssessmentSyncBar', () => ({
  default: () => null,
}));

const SMM_CEILING_COPY = 'Scoring SMM cap: 100 kg for your sex';
const SMM_PREAMBLE_COPY = 'Ceiling 100/67';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'muscle.standardsInfo.dualSovereignPreamble') {
        return `Ceiling ${String(options?.maleMax)}/${String(options?.femaleMax)}`;
      }
      if (key === 'muscle.standardsInfo.dualSovereignMale') {
        return `Scoring SMM cap: ${String(options?.max)} kg for your sex`;
      }
      if (key === 'muscle.standardsInfo.dualSovereignFemale') {
        return `Scoring SMM cap female: ${String(options?.max)} kg`;
      }
      if (key === 'home.profile.male') return 'Male';
      if (key === 'home.profile.female') return 'Female';
      return key;
    },
  }),
}));

function baseHookReturn() {
  return {
    profileReady: true,
    profile: { gender: 'male', weightKg: 92.8, age: 39 },
    smmInput: '44',
    setSmmInput: vi.fn(),
    previewScore: null,
    previewBreakdown: null,
    submitDone: false,
    errorKey: null,
    clearError: vi.fn(),
    calculate: vi.fn(),
    persistToDashboard: vi.fn(),
    submitToRadar: vi.fn(),
    smmCeilingKg: 100,
    scoreLocked: false,
  };
}

function renderPage(): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <MuscleAssessmentPage />
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

describe('MuscleAssessmentPage reference disclosure', () => {
  afterEach(() => {
    mockUseMuscleAssessmentPage.mockReset();
    mockUseScoreMeaning.mockReset();
    document.body.innerHTML = '';
  });

  it('hides smm ceiling copy while reference panel is collapsed', () => {
    mockUseMuscleAssessmentPage.mockReturnValue(baseHookReturn());
    mockUseScoreMeaning.mockReturnValue({
      title: null,
      summary: null,
      nextMilestone: null,
      remainingPoints: null,
    });

    const { container, unmount } = renderPage();
    const panel = container.querySelector('#muscle-standards-info-panel');

    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.textContent).toContain(SMM_PREAMBLE_COPY);
    expect(panel?.textContent).toContain(SMM_CEILING_COPY);

    unmount();
  });

  it('shows smm ceiling copy inside reference panel when expanded', () => {
    mockUseMuscleAssessmentPage.mockReturnValue(baseHookReturn());
    mockUseScoreMeaning.mockReturnValue({
      title: null,
      summary: null,
      nextMilestone: null,
      remainingPoints: null,
    });

    const { container, unmount } = renderPage();
    const toggle = container.querySelector('#muscle-standards-info-toggle') as HTMLButtonElement;

    act(() => {
      toggle.click();
    });

    expect(container.textContent).toContain(SMM_PREAMBLE_COPY);
    expect(container.textContent).toContain(SMM_CEILING_COPY);

    unmount();
  });

  it('shows female dual-sovereign copy when profile sex is female', () => {
    mockUseMuscleAssessmentPage.mockReturnValue({
      ...baseHookReturn(),
      profile: { gender: 'female', weightKg: 62, age: 28 },
      smmCeilingKg: 60,
    });
    mockUseScoreMeaning.mockReturnValue({
      title: null,
      summary: null,
      nextMilestone: null,
      remainingPoints: null,
    });

    const { container, unmount } = renderPage();
    const toggle = container.querySelector('#muscle-standards-info-toggle') as HTMLButtonElement;

    act(() => {
      toggle.click();
    });

    expect(container.textContent).toContain('Scoring SMM cap female: 60 kg');

    unmount();
  });
});
