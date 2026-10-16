/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ToolsPage from '../ToolsPage';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockUseVehicleCodexScores = vi.fn();
const mockUseCloudSyncCard = vi.fn();

vi.mock('../../hooks/useVehicleCodexScores', () => ({
  useVehicleCodexScores: () => mockUseVehicleCodexScores(),
}));

vi.mock('../../hooks/useCloudSyncCard', () => ({
  useCloudSyncCard: () => mockUseCloudSyncCard(),
}));

/** Avoid Firestore binding reads while rendering Garage chrome in unit tests. */
vi.mock('../../hooks/useCrewGuild', () => ({
  useCrewGuild: () => ({
    status: 'empty',
    guild: null,
    role: null,
    isCoach: false,
    isPro: false,
    fromCache: false,
    rankedMembers: [],
    authUid: null,
    busy: false,
    refreshing: false,
    actionError: null,
    clearActionError: vi.fn(),
    refresh: vi.fn(),
    create: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    kick: vi.fn(),
    rename: vi.fn(),
    disband: vi.fn(),
  }),
}));

vi.mock('../../components/tools/VehicleSpecificationCodex', () => ({
  VehicleSpecificationCodex: () => <div data-testid="vehicle-codex" />,
}));

vi.mock('../../components/tools/CloudSyncRestoreConfirmDialog', () => ({
  default: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'tools.sync.status.updatedAt' && options?.time) {
        return `Cloud Backup · ${String(options.time)}`;
      }
      const map: Record<string, string> = {
        'tools.syncTitle': 'Cloud Sync',
        'tools.syncBackup': 'Backup to Cloud',
        'tools.syncRestore': 'Restore from Cloud',
        'tools.syncUpgrade': 'Upgrade to PRO',
        'tools.sync.status.locked': 'Cloud backup is a PRO feature.',
        'tools.sync.status.loading': 'Checking cloud snapshot status…',
        'tools.sync.status.empty': 'No cloud backup yet',
        'tools.sync.footerHint': '※ Restoring will overwrite local data',
        'tools.kicker': 'Utility Deck',
        'tools.title': 'Tools & Cloud Sync',
        'tools.calculators.title': 'Training Calculators',
        'tools.calculators.oneRm.title': '1RM Calculator',
        'tools.calculators.plates.title': 'Plate Calculator',
        'tools.somatotypeLab.title': 'Somatochart',
        'tools.codex.panelTitle': 'Vehicle Codex',
        'assessment.referenceInfo.toggleExpand': 'Expand',
        'assessment.referenceInfo.toggleCollapse': 'Collapse',
        'crew.hq.code': 'CREW HQ',
        'crew.hq.title': 'Crew HQ',
        'crew.hq.enter': 'Enter HQ',
        'crew.hq.openAria': 'Open Crew HQ',
      };
      return map[key] ?? key;
    },
  }),
}));

function baseCardModel(overrides: Record<string, unknown> = {}) {
  return {
    canSync: true,
    statusLoading: false,
    busy: false,
    status: { exists: false, cloudUpdatedAt: null },
    feedback: null,
    restoreConfirmOpen: false,
    requestBackup: vi.fn(),
    requestRestore: vi.fn(),
    confirmRestore: vi.fn(),
    cancelRestore: vi.fn(),
    ...overrides,
  };
}

function renderPage(): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <ToolsPage />
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

describe('ToolsPage cloud sync card', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('shows compact status and footer for Pro-eligible users with a snapshot', () => {
    mockUseVehicleCodexScores.mockReturnValue({});
    mockUseCloudSyncCard.mockReturnValue(
      baseCardModel({
        canSync: true,
        status: { exists: true, cloudUpdatedAt: '2026-10-10T10:30:00.000Z' },
      })
    );

    const { container, unmount } = renderPage();

    expect(container.textContent).toContain('Cloud Backup ·');
    expect(container.textContent).toContain('Backup to Cloud');
    expect(container.textContent).toContain('Restore from Cloud');
    expect(container.textContent).toContain('※ Restoring will overwrite local data');
    expect(container.textContent).not.toContain('Upgrade to PRO');

    unmount();
  });

  it('disables backup/restore and shows upgrade CTA when not Pro-eligible', () => {
    mockUseVehicleCodexScores.mockReturnValue({});
    mockUseCloudSyncCard.mockReturnValue(
      baseCardModel({
        canSync: false,
        status: { exists: false, cloudUpdatedAt: null },
      })
    );

    const { container, unmount } = renderPage();
    const buttons = Array.from(container.querySelectorAll('button'));
    const backup = buttons.find((b) => b.textContent === 'Backup to Cloud');
    const restore = buttons.find((b) => b.textContent === 'Restore from Cloud');

    expect(container.textContent).toContain('Cloud backup is a PRO feature.');
    expect(backup?.disabled).toBe(true);
    expect(restore?.disabled).toBe(true);
    expect(container.textContent).toContain('Upgrade to PRO');

    unmount();
  });

  it('shows empty backup status for Pro users without cloud data', () => {
    mockUseVehicleCodexScores.mockReturnValue({});
    mockUseCloudSyncCard.mockReturnValue(
      baseCardModel({
        canSync: true,
        status: { exists: false, cloudUpdatedAt: null },
      })
    );

    const { container, unmount } = renderPage();

    expect(container.textContent).toContain('No cloud backup yet');
    expect(container.textContent).not.toContain('Upgrade to PRO');

    unmount();
  });
});
