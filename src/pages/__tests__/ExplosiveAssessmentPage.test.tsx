/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExplosiveAssessmentPage from '../ExplosiveAssessmentPage';

const mockUseExplosiveAssessmentPage = vi.fn();
const mockUseScoreMeaning = vi.fn();

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../hooks/useExplosiveAssessmentPage', () => ({
  useExplosiveAssessmentPage: () => mockUseExplosiveAssessmentPage(),
}));

vi.mock('../../hooks/useScoreMeaning', () => ({
  useScoreMeaning: (...args: unknown[]) => mockUseScoreMeaning(...args),
}));

vi.mock('../../hooks/useExplosiveMilestoneHint', () => ({
  useExplosiveMilestoneHint: () => null,
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

vi.mock('../../hooks/useHallOfFameSpectrumDrawer', () => ({
  useHallOfFameSpectrumDrawer: () => ({
    canOpen: false,
    openDrawer: vi.fn(),
    drawerProps: { open: false },
    headerActionProps: {},
    badgeProps: {},
  }),
}));

vi.mock('../../hooks/useLeaderboardSyncAssessmentPage', () => ({
  useLeaderboardSyncAssessmentPage: () => null,
}));

vi.mock('../../hooks/useUnit', () => ({
  useUnit: () => ({
    labels: { length: 'cm', weight: 'kg' },
    unitSystem: 'metric',
    setUnitSystem: vi.fn(),
    displayLength: (n: number) => n,
  }),
}));

vi.mock('../../components/assessment/AssessmentCeremonyOverlay', () => ({
  default: () => null,
}));

vi.mock('../../components/assessment/PerformanceBreakthroughModal', () => ({
  default: () => null,
}));

vi.mock('../../components/assessment/HallOfFameSpectrumDrawer', () => ({
  default: () => null,
}));

vi.mock('../../hooks/flushSingleLeafAssessmentDraft', () => ({
  flushExplosiveDraft: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function baseHook(overrides: Record<string, unknown> = {}) {
  return {
    profile: {
      gender: 'male',
      age: 25,
      heightCm: 178,
      weightKg: 75,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    profileReady: true,
    activeTab: 'jumps',
    setActiveTab: vi.fn(),
    verticalJumpInput: '55',
    setVerticalJumpInput: vi.fn(),
    standingLongJumpInput: '220',
    setStandingLongJumpInput: vi.fn(),
    sprintInput: '',
    setSprintInput: vi.fn(),
    metricScoringInputs: {
      verticalJumpInput: '55',
      standingLongJumpInput: '220',
      sprintInput: '',
    },
    branchMetricInputs: {
      verticalJumpInput: '55',
      standingLongJumpInput: '220',
      sprintInput: '',
    },
    previewScore: 95,
    previewBreakdown: {
      verticalJumpRaw: 90,
      standingLongJumpRaw: 100,
      sprintRaw: null,
      averageRaw: 95,
    },
    perBranchResult: {
      verticalJump: { raw: 90 },
      standingLongJump: { raw: 100 },
    },
    capNoticeInterpolation: null,
    powerNormAnchors: null,
    submitDone: false,
    errorKey: null,
    clearError: vi.fn(),
    calculateBranch: vi.fn(() => true),
    calculate: vi.fn(),
    persistToDashboard: vi.fn(() => true),
    submitAssessment: vi.fn(),
    ...overrides,
  };
}

describe('ExplosiveAssessmentPage branch cards', () => {
  let root: Root;
  let host: HTMLDivElement;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('renders independent branch cards with scores and keeps /2 average in composite', () => {
    mockUseExplosiveAssessmentPage.mockReturnValue(baseHook());
    mockUseScoreMeaning.mockReturnValue({
      decadeKey: '90',
      populationClass: '菁英',
      bandId: 'TIER_90',
      bandLabel: 'T90',
    });

    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <MemoryRouter>
          <ExplosiveAssessmentPage />
        </MemoryRouter>
      );
    });

    expect(
      document.querySelector('[data-testid="explosive-branch-result-verticalJump"]')
        ?.textContent
    ).toContain('90.00');
    expect(
      document.querySelector(
        '[data-testid="explosive-branch-result-standingLongJump"]'
      )?.textContent
    ).toContain('100.00');
    expect(
      document.querySelector(
        '[data-testid="aesthetic-single-leaf-trigger-explosive.verticalJump"]'
      )
    ).not.toBeNull();
    expect(
      document.querySelector(
        '[data-testid="aesthetic-single-leaf-trigger-explosive.standingLongJump"]'
      )
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="explosive-axis-average-raw"]')?.textContent
    ).toBe('95.00');
  });

  it('wires calculateBranch for each jump card', () => {
    const calculateBranch = vi.fn(() => true);
    mockUseExplosiveAssessmentPage.mockReturnValue(baseHook({ calculateBranch }));
    mockUseScoreMeaning.mockReturnValue(null);

    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <MemoryRouter>
          <ExplosiveAssessmentPage />
        </MemoryRouter>
      );
    });

    act(() => {
      document
        .querySelector('[data-testid="explosive-branch-calc-verticalJump"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      document
        .querySelector('[data-testid="explosive-branch-calc-standingLongJump"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(calculateBranch).toHaveBeenCalledWith('verticalJump');
    expect(calculateBranch).toHaveBeenCalledWith('standingLongJump');
  });
});
