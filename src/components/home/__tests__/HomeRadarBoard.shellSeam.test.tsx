/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../i18n';
import {
  HOME_RADAR_BOARD_COMPOSITOR_CLASS,
  HOME_RADAR_BOARD_FACE_CLASS,
  HOME_RADAR_BOARD_RIM_CLASS,
  HomeRadarBoard,
} from '../HomeRadarBoard';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const memory = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => {
    memory.clear();
  },
});

vi.mock('../../../hooks/useCoreSixRadar', () => ({
  useCoreSixRadar: () => ({
    radarPoints: [
      { key: 'strength', value: 71.4, label: '最大肌力' },
      { key: 'explosivePower', value: 80, label: '爆發力' },
      { key: 'cardio', value: 90, label: '心肺耐力' },
      { key: 'muscleMass', value: 70, label: '骨骼肌量' },
      { key: 'bodyFat', value: 85, label: 'FFMI' },
      { key: 'gripStrength', value: 91, label: '握力' },
    ],
    overallScore: 81.23,
    scaleMax: 120,
  }),
}));

vi.mock('../../../hooks/useHomeResonanceRitual', () => ({
  useHomeResonanceRitual: () => ({
    open: false,
    phase: 'idle',
    ritualFill: 0,
    displayScore: 0,
    showBootScore: false,
    typedGradeLine: '',
    snapshot: null,
    startRitual: vi.fn(),
    closeRitual: vi.fn(),
  }),
}));

vi.mock('../../../stores/uiInteractionStore', () => ({
  useShellInteractionBlocked: () => false,
}));

vi.mock('../../ladder/LeaderboardSyncAllBar', () => ({
  default: () => <div data-testid="sync-bar" />,
}));

vi.mock('../HomeResonanceOverlay', () => ({
  default: () => null,
}));

vi.mock('../../aesthetic/AestheticSpecModal', () => ({
  default: () => null,
}));

vi.mock('../../radar/HexRadarChart', () => ({
  default: () => <div data-testid="radar" />,
}));

vi.mock('../../../services/hapticService', () => ({
  hapticService: {
    trigger: vi.fn(),
    triggerContinuousSoft: vi.fn(),
    stopContinuousSoft: vi.fn(),
  },
}));

describe('HomeRadarBoard shell seam (Retina dual-chrome guard)', () => {
  let container: HTMLDivElement | undefined;
  let root: Root | undefined;

  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  beforeEach(() => {
    memory.clear();
  });

  afterEach(() => {
    if (root) {
      const mounted = root;
      act(() => {
        mounted.unmount();
      });
    }
    container?.remove();
    memory.clear();
  });

  function renderBoard(): void {
    container = document.createElement('div');
    document.body.appendChild(container);
    const nextRoot = createRoot(container);
    root = nextRoot;
    act(() => {
      nextRoot.render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <HomeRadarBoard />
          </MemoryRouter>
        </I18nextProvider>
      );
    });
  }

  it('uses opaque dual-shell chrome without a straight top-0 h-px hairline', () => {
    renderBoard();

    const board = container!.querySelector('[data-testid="home-radar-board"]');
    const face = container!.querySelector('[data-testid="home-radar-board-face"]');
    expect(board).toBeTruthy();
    expect(face).toBeTruthy();

    expect(board?.className).toContain(HOME_RADAR_BOARD_RIM_CLASS);
    expect(board?.className).not.toContain('ui-card');
    expect(face?.className).toBe(HOME_RADAR_BOARD_FACE_CLASS);
    expect(HOME_RADAR_BOARD_FACE_CLASS).toContain('bg-bg-card');
    expect(HOME_RADAR_BOARD_FACE_CLASS).not.toContain('bg-bg-card/90');
    expect(HOME_RADAR_BOARD_FACE_CLASS).toContain('rounded-[calc(1rem-1px)]');
    expect(HOME_RADAR_BOARD_RIM_CLASS).toContain('rounded-2xl');
    expect(HOME_RADAR_BOARD_RIM_CLASS).toContain(HOME_RADAR_BOARD_COMPOSITOR_CLASS);
    expect(HOME_RADAR_BOARD_COMPOSITOR_CLASS).toContain('isolation-isolate');
    expect(HOME_RADAR_BOARD_COMPOSITOR_CLASS).toContain('transform-gpu');

    const straightHairlines = Array.from(board!.querySelectorAll('.absolute')).filter((el) => {
      const cls = el.className;
      return (
        typeof cls === 'string' &&
        cls.includes('top-0') &&
        cls.includes('h-px') &&
        cls.includes('inset-x-0')
      );
    });
    expect(straightHairlines).toHaveLength(0);
  });
});
